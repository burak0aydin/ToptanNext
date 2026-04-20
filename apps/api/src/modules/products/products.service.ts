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

const MAX_LISTING_MEDIA_COUNT = 5;

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

    const normalizedSectorIds = this.normalizeStringArray(dto.sectorIds ?? []);
    if (normalizedSectorIds.length > 0) {
      const sectors = await this.productsRepository.findManySectorsByIds(
        normalizedSectorIds,
      );
      const activeSectorIds = new Set(
        sectors.filter((sector) => sector.isActive).map((sector) => sector.id),
      );

      for (const sectorId of normalizedSectorIds) {
        if (!activeSectorIds.has(sectorId)) {
          throw new UnprocessableEntityException(
            'Seçilen sektörlerden biri geçersiz veya pasif durumda.',
          );
        }
      }
    }

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
      categoryId: category.id,
      sectorIds: normalizedSectorIds,
      featuredFeatures: this.normalizeStringArray(dto.featuredFeatures ?? []),
      isCustomizable: dto.isCustomizable ?? false,
      customizationNote: this.normalizeOptionalText(dto.customizationNote),
    };

    return this.productsRepository.createProductListing(input);
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

    const existingCount = await this.productsRepository.countProductListingMedia(
      listing.id,
    );

    if (existingCount + files.length > MAX_LISTING_MEDIA_COUNT) {
      throw new BadRequestException('Bir ürün için en fazla 5 görsel veya video yükleyebilirsiniz.');
    }

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
    if (mimeType.startsWith('video/')) {
      return ProductListingMediaType.VIDEO;
    }

    return ProductListingMediaType.IMAGE;
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

    if (listing.media.length === 0) {
      throw new BadRequestException('Ürünü göndermek için en az bir görsel veya video yüklemelisiniz.');
    }
  }

  private async generateUniqueListingSlug(
    supplierId: string,
    value: string,
  ): Promise<string> {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.productsRepository.findProductListingBySupplierAndSlug(
        supplierId,
        candidate,
      );
      if (!existing) {
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
