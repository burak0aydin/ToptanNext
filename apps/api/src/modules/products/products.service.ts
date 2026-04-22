import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ProductListingMediaType,
  ProductListingStatus,
  Role,
} from '@prisma/client';
import { CreateProductListingStepOneDto } from './dto/create-product-listing-step-one.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { SubmitProductListingDto } from './dto/submit-product-listing.dto';
import { UpdateProductListingStepThreeDto } from './dto/update-product-listing-step-three.dto';
import { UpdateProductListingStepTwoDto } from './dto/update-product-listing-step-two.dto';
import {
  CreateProductListingInput,
  CreateProductInput,
  CreateProductListingMediaInput,
  ProductListingRecord,
  ProductRecord,
  ProductsRepository,
  UpdateProductListingStepOneInput,
} from './products.repository';

export type UploadedProductListingMedia = {
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
};

const LISTING_EDITABLE_STATUSES: ProductListingStatus[] = [
  ProductListingStatus.DRAFT,
  ProductListingStatus.REJECTED,
];

const MAX_LISTING_IMAGE_COUNT = 6;
const MAX_LISTING_VIDEO_COUNT = 1;
const MAX_IMAGE_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const OTHER_OPTION_VALUE = 'other';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getAll(): Promise<ProductRecord[]> {
    return this.productsRepository.findAll();
  }

  async create(dto: CreateProductDto): Promise<ProductRecord> {
    const normalizedName = this.normalizeRequiredText(dto.name, 'Ürün adı boş olamaz.');

    const category = await this.productsRepository.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    if (category.level !== 3) {
      throw new UnprocessableEntityException('Ürün sadece level 3 kategoriye eklenebilir.');
    }

    if (!category.isActive) {
      throw new UnprocessableEntityException('Pasif kategoriye ürün eklenemez.');
    }

    let sectorId: string | null = null;

    if (dto.sectorId) {
      const sector = await this.productsRepository.findSectorById(dto.sectorId);
      if (!sector) {
        throw new NotFoundException('Sektör bulunamadı.');
      }

      if (!sector.isActive) {
        throw new UnprocessableEntityException('Pasif sektör ürün için seçilemez.');
      }

      sectorId = sector.id;
    }

    const preferredSlug = dto.slug ? this.normalizeRequiredText(dto.slug, 'Slug boş olamaz.') : normalizedName;
    const uniqueSlug = await this.generateUniqueSlug(preferredSlug);

    const input: CreateProductInput = {
      name: normalizedName,
      slug: uniqueSlug,
      categoryId: category.id,
      sectorId,
    };

    return this.productsRepository.create(input);
  }

  async getMyListings(supplierId: string, role: Role): Promise<ProductListingRecord[]> {
    this.ensureSupplierRole(role);
    return this.productsRepository.findProductListingsBySupplier(supplierId);
  }

  async getMyListingById(
    supplierId: string,
    role: Role,
    listingId: string,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    return this.getOwnedListingOrThrow(supplierId, listingId);
  }

  async createMyListingStepOne(
    supplierId: string,
    role: Role,
    dto: CreateProductListingStepOneDto,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);

    const name = this.normalizeRequiredText(dto.name, 'Ürün adı boş olamaz.');
    const sku = this.normalizeRequiredText(dto.sku, 'SKU boş olamaz.');
    const description = this.normalizeRequiredText(
      dto.description,
      'Ürün açıklaması boş olamaz.',
    );
    const stepOneRefs = await this.resolveStepOneReferences(dto);

    const duplicateSku = await this.productsRepository.findProductListingBySupplierAndSku(
      supplierId,
      sku,
    );
    if (duplicateSku) {
      throw new BadRequestException('Bu SKU zaten kullanılıyor.');
    }

    const slug = await this.generateUniqueListingSlug(supplierId, name);

    const input: CreateProductListingInput = {
      supplierId,
      name,
      slug,
      sku,
      description,
      categoryId: stepOneRefs.categoryId,
      sectorIds: stepOneRefs.sectorIds,
      featuredFeatures: this.normalizeStringArray(dto.featuredFeatures ?? []),
      isCustomizable: dto.isCustomizable ?? false,
      customizationNote: this.normalizeOptionalText(dto.customizationNote),
    };

    return this.productsRepository.createProductListing(input);
  }

  async updateMyListingStepOne(
    supplierId: string,
    role: Role,
    listingId: string,
    dto: CreateProductListingStepOneDto,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);
    this.ensureListingEditable(listing.status);

    const name = this.normalizeRequiredText(dto.name, 'Ürün adı boş olamaz.');
    const sku = this.normalizeRequiredText(dto.sku, 'SKU boş olamaz.');
    const description = this.normalizeRequiredText(
      dto.description,
      'Ürün açıklaması boş olamaz.',
    );
    const stepOneRefs = await this.resolveStepOneReferences(dto);

    const duplicateSku = await this.productsRepository.findProductListingBySupplierAndSku(
      supplierId,
      sku,
    );

    if (duplicateSku && duplicateSku.id !== listing.id) {
      throw new BadRequestException('Bu SKU zaten kullanılıyor.');
    }

    const slug = listing.name === name
      ? listing.slug
      : await this.generateUniqueListingSlug(supplierId, name, listing.id);

    const input: UpdateProductListingStepOneInput = {
      name,
      slug,
      sku,
      description,
      categoryId: stepOneRefs.categoryId,
      sectorIds: stepOneRefs.sectorIds,
      featuredFeatures: this.normalizeStringArray(dto.featuredFeatures ?? []),
      isCustomizable: dto.isCustomizable ?? false,
      customizationNote: this.normalizeOptionalText(dto.customizationNote),
    };

    return this.productsRepository.updateProductListingStepOne(listing.id, input);
  }

  async updateMyListingStepTwo(
    supplierId: string,
    role: Role,
    listingId: string,
    dto: UpdateProductListingStepTwoDto,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);
    this.ensureListingEditable(listing.status);

    const normalizedCurrency = (dto.currency ?? listing.currency)
      .trim()
      .toUpperCase();

    if (normalizedCurrency.length !== 3) {
      throw new BadRequestException('Para birimi 3 karakter olmalıdır.');
    }

    return this.productsRepository.updateProductListingStepTwo(listing.id, {
      basePrice: dto.basePrice,
      currency: normalizedCurrency,
      minOrderQuantity: dto.minOrderQuantity,
      stock: dto.stock,
    });
  }

  async updateMyListingStepThree(
    supplierId: string,
    role: Role,
    listingId: string,
    dto: UpdateProductListingStepThreeDto,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);
    this.ensureListingEditable(listing.status);

    return this.productsRepository.updateProductListingStepThree(listing.id, {
      leadTimeDays: dto.leadTimeDays,
      packageLengthCm: dto.packageLengthCm,
      packageWidthCm: dto.packageWidthCm,
      packageHeightCm: dto.packageHeightCm,
      packageWeightKg: dto.packageWeightKg,
    });
  }

  async uploadMyListingMedia(
    supplierId: string,
    role: Role,
    listingId: string,
    files: UploadedProductListingMedia[],
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);
    this.ensureListingEditable(listing.status);

    if (files.length === 0) {
      throw new BadRequestException('En az bir medya dosyası yüklemelisiniz.');
    }

    let existingImageCount = listing.media.filter(
      (item) => item.mediaType === ProductListingMediaType.IMAGE,
    ).length;
    let existingVideoCount = listing.media.filter(
      (item) => item.mediaType === ProductListingMediaType.VIDEO,
    ).length;

    for (const file of files) {
      const mediaType = this.resolveMediaType(file.mimeType);

      if (mediaType === ProductListingMediaType.IMAGE) {
        if (file.fileSize > MAX_IMAGE_FILE_SIZE_BYTES) {
          throw new BadRequestException('Görsel boyutu maksimum 3 MB olabilir.');
        }

        existingImageCount += 1;
        if (existingImageCount > MAX_LISTING_IMAGE_COUNT) {
          throw new BadRequestException('Toplamda 1 kapak ve en fazla 5 galeri görseli yükleyebilirsiniz.');
        }

        continue;
      }

      if (file.fileSize > MAX_VIDEO_FILE_SIZE_BYTES) {
        throw new BadRequestException('Video boyutu maksimum 15 MB olabilir.');
      }

      existingVideoCount += 1;
      if (existingVideoCount > MAX_LISTING_VIDEO_COUNT) {
        throw new BadRequestException('En fazla 1 video yükleyebilirsiniz.');
      }
    }

    const existingCount = listing.media.length;

    const createInputs: CreateProductListingMediaInput[] = files.map((file, index) => ({
      productListingId: listing.id,
      mediaType: this.resolveMediaType(file.mimeType),
      filePath: file.filePath,
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      displayOrder: existingCount + index,
    }));

    await this.productsRepository.createProductListingMedia(createInputs);

    return this.getOwnedListingOrThrow(supplierId, listing.id);
  }

  async submitMyListing(
    supplierId: string,
    role: Role,
    listingId: string,
    dto: SubmitProductListingDto,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);

    if (!dto.confirmSubmission) {
      throw new BadRequestException('Ürünü göndermek için onay vermelisiniz.');
    }

    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);
    this.ensureListingEditable(listing.status);
    this.validateListingReadyForSubmission(listing);

    return this.productsRepository.updateProductListingStatus(
      listing.id,
      ProductListingStatus.PENDING_REVIEW,
      null,
      new Date(),
    );
  }

  private normalizeRequiredText(value: string, message: string): string {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeStringArray(values: string[]): string[] {
    const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
    return [...new Set(normalized)];
  }

  private ensureSupplierRole(role: Role): void {
    if (role !== Role.SUPPLIER) {
      throw new ForbiddenException('Bu işlem için satıcı hesabı gereklidir.');
    }
  }

  private async getOwnedListingOrThrow(
    supplierId: string,
    listingId: string,
  ): Promise<ProductListingRecord> {
    const listing = await this.productsRepository.findProductListingBySupplierAndId(
      supplierId,
      listingId,
    );

    if (!listing) {
      throw new NotFoundException('Ürün taslağı bulunamadı.');
    }

    return listing;
  }

  private ensureListingEditable(status: ProductListingStatus): void {
    if (!LISTING_EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        'Bu taslak mevcut durumunda düzenlenemez. Lütfen admin değerlendirmesini bekleyiniz.',
      );
    }
  }

  private resolveMediaType(mimeType: string): ProductListingMediaType {
    if (mimeType === 'video/mp4' || mimeType === 'video/webm') {
      return ProductListingMediaType.VIDEO;
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
      return ProductListingMediaType.IMAGE;
    }

    throw new BadRequestException('Desteklenmeyen medya formatı.');
  }

  private validateListingReadyForSubmission(listing: ProductListingRecord): void {
    if (listing.basePrice === null) {
      throw new BadRequestException('Birim fiyat bilgisi zorunludur.');
    }

    if (listing.minOrderQuantity === null) {
      throw new BadRequestException('Minimum sipariş adedi zorunludur.');
    }

    if (listing.stock === null) {
      throw new BadRequestException('Stok bilgisi zorunludur.');
    }

    if (listing.leadTimeDays === null) {
      throw new BadRequestException('Tedarik süresi bilgisi zorunludur.');
    }

    if (
      listing.packageLengthCm === null ||
      listing.packageWidthCm === null ||
      listing.packageHeightCm === null ||
      listing.packageWeightKg === null
    ) {
      throw new BadRequestException('Paket ölçüleri ve ağırlık bilgisi zorunludur.');
    }

    const imageCount = listing.media.filter(
      (item) => item.mediaType === ProductListingMediaType.IMAGE,
    ).length;
    const videoCount = listing.media.filter(
      (item) => item.mediaType === ProductListingMediaType.VIDEO,
    ).length;

    if (imageCount === 0) {
      throw new BadRequestException('En az 1 kapak görseli yüklemelisiniz.');
    }

    if (imageCount > MAX_LISTING_IMAGE_COUNT) {
      throw new BadRequestException('Toplam görsel sayısı 6 adedi geçemez.');
    }

    if (videoCount > MAX_LISTING_VIDEO_COUNT) {
      throw new BadRequestException('En fazla 1 video yükleyebilirsiniz.');
    }
  }

  private async generateUniqueListingSlug(
    supplierId: string,
    value: string,
    skipListingId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.productsRepository.findProductListingBySupplierAndSlug(
        supplierId,
        candidate,
      );
      if (!existing || existing.id === skipListingId) {
        return candidate;
      }

      candidate = `${baseSlug}-${index}`;
      index += 1;
    }
  }

  private async generateUniqueSlug(value: string): Promise<string> {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.productsRepository.findBySlug(candidate);
      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${index}`;
      index += 1;
    }
  }

  private async resolveStepOneReferences(
    dto: CreateProductListingStepOneDto,
  ): Promise<{ categoryId: string; sectorIds: string[] }> {
    let category = await this.productsRepository.findCategoryById(dto.categoryId);

    if (dto.categoryId === OTHER_OPTION_VALUE) {
      category = await this.productsRepository.ensureHiddenOtherCategory();
    }

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    if (category.level !== 3) {
      throw new UnprocessableEntityException('Ürün sadece level 3 kategoriye eklenebilir.');
    }

    if (!category.isActive && dto.categoryId !== OTHER_OPTION_VALUE) {
      throw new UnprocessableEntityException('Pasif kategoriye ürün eklenemez.');
    }

    const normalizedSectorIds = this.normalizeStringArray(dto.sectorIds ?? []);
    const hasOtherSector = normalizedSectorIds.includes(OTHER_OPTION_VALUE);
    const validatedSectorIds = normalizedSectorIds.filter(
      (sectorId) => sectorId !== OTHER_OPTION_VALUE,
    );

    if (validatedSectorIds.length > 0) {
      const sectors = await this.productsRepository.findManySectorsByIds(
        validatedSectorIds,
      );
      const activeSectorIds = new Set(
        sectors.filter((sector) => sector.isActive).map((sector) => sector.id),
      );

      for (const sectorId of validatedSectorIds) {
        if (!activeSectorIds.has(sectorId)) {
          throw new UnprocessableEntityException(
            'Seçilen sektörlerden biri geçersiz veya pasif durumda.',
          );
        }
      }
    }

    if (hasOtherSector) {
      const otherSector = await this.productsRepository.ensureHiddenOtherSector();
      validatedSectorIds.push(otherSector.id);
    }

    return {
      categoryId: category.id,
      sectorIds: [...new Set(validatedSectorIds)],
    };
  }

  private slugify(value: string): string {
    const normalized = value
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    return normalized
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }
}
