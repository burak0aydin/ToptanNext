import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ProductListingDeliveryMethod,
  ProductListingMediaType,
  ProductListingStatus,
  Role,
} from '@prisma/client';
import { CreateProductListingStepOneDto } from './dto/create-product-listing-step-one.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { SubmitProductListingDto } from './dto/submit-product-listing.dto';
import { ReviewProductListingDto } from './dto/review-product-listing.dto';
import { UpdateProductListingStepThreeDto } from './dto/update-product-listing-step-three.dto';
import { UpdateProductListingStepTwoDto } from './dto/update-product-listing-step-two.dto';
import {
  AdminProductListingStatusFilter,
  CreateProductListingInput,
  CreateProductInput,
  CreateProductListingMediaInput,
  ProductListingPricingTierRecord,
  ProductListingManagementResult,
  ProductListingManagementStatusFilter,
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

export type ProductListingManagementQuery = {
  page: number;
  limit: number;
  categoryId?: string;
  status?: ProductListingManagementStatusFilter;
};

type AdminProductListingGrowthPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type AdminProductListingManagementQuery = {
  page: number;
  limit: number;
  period?: AdminProductListingGrowthPeriod;
  categoryId?: string;
  status?: AdminProductListingStatusFilter;
};

const LISTING_EDITABLE_STATUSES: ProductListingStatus[] = [
  ProductListingStatus.DRAFT,
  ProductListingStatus.REJECTED,
];

const MAX_LISTING_IMAGE_COUNT = 6;
const MAX_LISTING_VIDEO_COUNT = 1;
const MAX_IMAGE_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_PRICING_TIER_COUNT = 6;
const OTHER_OPTION_VALUE = 'other';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getAll(): Promise<ProductRecord[]> {
    return this.productsRepository.findAll();
  }

  async getAdminListings(role: Role): Promise<ProductListingRecord[]> {
    this.ensureAdminRole(role);
    return this.productsRepository.findProductListingsForAdmin();
  }

  async getAdminListingManagement(
    role: Role,
    query: AdminProductListingManagementQuery,
  ): Promise<{
    summary: {
      totalProducts: number;
      pendingReview: number;
    };
    growth: {
      period: AdminProductListingGrowthPeriod;
      labels: string[];
      values: number[];
    };
    categoryDistribution: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      percentage: number;
    }>;
    listings: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      items: ProductListingRecord[];
    };
  }> {
    this.ensureAdminRole(role);

    const page = Math.max(1, query.page);
    const limit = Math.min(Math.max(query.limit, 5), 100);
    const period = query.period ?? 'WEEKLY';
    const status = query.status ?? 'ALL';

    const [summary, listResult, growth, categoryDistribution] = await Promise.all([
      this.productsRepository.countProductListingsForAdmin(),
      this.productsRepository.findProductListingsForAdminManagement({
        status,
        categoryId: query.categoryId,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.buildAdminGrowth(period),
      this.productsRepository.getAdminCategoryDistribution(5),
    ]);

    return {
      summary,
      growth: {
        period,
        labels: growth.labels,
        values: growth.values,
      },
      categoryDistribution: categoryDistribution.map((item) => ({
        ...item,
        percentage:
          summary.totalProducts === 0
            ? 0
            : Number(((item.count / summary.totalProducts) * 100).toFixed(1)),
      })),
      listings: {
        total: listResult.total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(listResult.total / limit)),
        items: listResult.items,
      },
    };
  }

  async reviewListingByAdmin(
    role: Role,
    listingId: string,
    dto: ReviewProductListingDto,
  ): Promise<ProductListingRecord> {
    this.ensureAdminRole(role);

    const listing = await this.productsRepository.findProductListingById(listingId);
    if (!listing) {
      throw new NotFoundException('Ürün başvurusu bulunamadı.');
    }

    const reviewNote = this.normalizeOptionalText(dto.reviewNote);
    if (dto.status === 'REJECTED' && !reviewNote) {
      throw new BadRequestException(
        'Ürünü reddetmek için değerlendirme notu zorunludur.',
      );
    }

    return this.productsRepository.updateProductListingReviewByAdmin(
      listing.id,
      dto.status,
      reviewNote,
    );
  }

  async getListingByAdmin(
    role: Role,
    listingId: string,
  ): Promise<ProductListingRecord> {
    this.ensureAdminRole(role);
    return this.getListingForAdminOrThrow(listingId);
  }

  async updateListingStepOneByAdmin(
    role: Role,
    listingId: string,
    dto: CreateProductListingStepOneDto,
  ): Promise<ProductListingRecord> {
    this.ensureAdminRole(role);
    const listing = await this.getListingForAdminOrThrow(listingId);

    const name = this.normalizeRequiredText(dto.name, 'Ürün adı boş olamaz.');
    const sku = this.normalizeRequiredText(dto.sku, 'SKU boş olamaz.');
    const description = this.normalizeRequiredText(
      dto.description,
      'Ürün açıklaması boş olamaz.',
    );
    const stepOneRefs = await this.resolveStepOneReferences(dto);

    const duplicateSku = await this.productsRepository.findProductListingBySupplierAndSku(
      listing.supplierId,
      sku,
    );

    if (duplicateSku && duplicateSku.id !== listing.id) {
      throw new BadRequestException('Bu SKU zaten kullanılıyor.');
    }

    const slug = listing.name === name
      ? listing.slug
      : await this.generateUniqueListingSlug(
        listing.supplierId,
        name,
        listing.id,
      );

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

  async updateListingStepTwoByAdmin(
    role: Role,
    listingId: string,
    dto: UpdateProductListingStepTwoDto,
  ): Promise<ProductListingRecord> {
    this.ensureAdminRole(role);
    const listing = await this.getListingForAdminOrThrow(listingId);

    const pricingTiers = this.normalizePricingTiers(dto.pricingTiers);

    if (pricingTiers.length === 0) {
      throw new BadRequestException('En az 1 fiyat kademesi tanımlamalısınız.');
    }

    if (pricingTiers.length > MAX_PRICING_TIER_COUNT) {
      throw new BadRequestException('En fazla 6 fiyat kademesi tanımlayabilirsiniz.');
    }

    const minOrderTier = pricingTiers.find((tier) => (
      dto.minOrderQuantity >= tier.minQuantity && dto.minOrderQuantity <= tier.maxQuantity
    ));

    if (!minOrderTier) {
      throw new BadRequestException('Minimum sipariş adedi, tanımlanan bir kademe aralığında olmalıdır.');
    }

    const normalizedNegotiationThreshold = dto.isNegotiationEnabled
      ? dto.negotiationThreshold ?? null
      : null;

    if (dto.isNegotiationEnabled && normalizedNegotiationThreshold === null) {
      throw new BadRequestException('Pazarlık eşiği aktifse pazarlık sınırı zorunludur.');
    }

    if (
      normalizedNegotiationThreshold !== null &&
      normalizedNegotiationThreshold < dto.minOrderQuantity
    ) {
      throw new BadRequestException('Pazarlık sınırı, minimum sipariş adedinden küçük olamaz.');
    }

    return this.productsRepository.updateProductListingStepTwo(listing.id, {
      basePrice: minOrderTier.unitPrice,
      currency: 'TRY',
      minOrderQuantity: dto.minOrderQuantity,
      stock: dto.stock,
      isNegotiationEnabled: dto.isNegotiationEnabled,
      negotiationThreshold: normalizedNegotiationThreshold,
      pricingTiers,
    });
  }

  async updateListingStepThreeByAdmin(
    role: Role,
    listingId: string,
    dto: UpdateProductListingStepThreeDto,
  ): Promise<ProductListingRecord> {
    this.ensureAdminRole(role);
    const listing = await this.getListingForAdminOrThrow(listingId);
    const deliveryMethods = this.normalizeDeliveryMethods(dto.deliveryMethods);

    return this.productsRepository.updateProductListingStepThree(listing.id, {
      packageType: dto.packageType,
      leadTimeDays: dto.leadTimeDays,
      shippingTime: dto.shippingTime,
      deliveryMethods,
      dynamicFreightAgreement: dto.dynamicFreightAgreement,
      packageLengthCm: dto.packageLengthCm,
      packageWidthCm: dto.packageWidthCm,
      packageHeightCm: dto.packageHeightCm,
      packageWeightKg: dto.packageWeightKg,
    });
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

  async getMyListingManagement(
    supplierId: string,
    role: Role,
    query: ProductListingManagementQuery,
  ): Promise<ProductListingManagementResult & {
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.ensureSupplierRole(role);

    const page = Math.max(1, query.page);
    const limit = Math.min(Math.max(query.limit, 5), 50);
    const result =
      await this.productsRepository.findProductListingsForSupplierManagement({
        supplierId,
        categoryId: query.categoryId,
        status: query.status ?? 'ALL',
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(result.total / limit)),
    };
  }

  async getMyListingById(
    supplierId: string,
    role: Role,
    listingId: string,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    return this.getOwnedListingOrThrow(supplierId, listingId);
  }

  async updateMyListingActiveStatus(
    supplierId: string,
    role: Role,
    listingId: string,
    isActive: boolean,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);

    if (listing.status === ProductListingStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Onay bekleyen ürünlerin aktiflik durumu değiştirilemez.',
      );
    }

    return this.productsRepository.updateProductListingActiveStatus(
      listing.id,
      isActive,
    );
  }

  async deleteMyListing(
    supplierId: string,
    role: Role,
    listingId: string,
  ): Promise<ProductListingRecord> {
    this.ensureSupplierRole(role);
    const listing = await this.getOwnedListingOrThrow(supplierId, listingId);

    if (listing.status === ProductListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Onay bekleyen ürün silinemez.');
    }

    return this.productsRepository.softDeleteProductListing(listing.id);
  }

  async getListingMediaById(
    mediaId: string,
  ): Promise<{ filePath: string; mimeType: string; originalName: string }> {
    const media = await this.productsRepository.findProductListingMediaById(mediaId);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı.');
    }

    return media;
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

    const pricingTiers = this.normalizePricingTiers(dto.pricingTiers);

    if (pricingTiers.length === 0) {
      throw new BadRequestException('En az 1 fiyat kademesi tanımlamalısınız.');
    }

    if (pricingTiers.length > MAX_PRICING_TIER_COUNT) {
      throw new BadRequestException('En fazla 6 fiyat kademesi tanımlayabilirsiniz.');
    }

    const minOrderTier = pricingTiers.find((tier) => (
      dto.minOrderQuantity >= tier.minQuantity && dto.minOrderQuantity <= tier.maxQuantity
    ));

    if (!minOrderTier) {
      throw new BadRequestException('Minimum sipariş adedi, tanımlanan bir kademe aralığında olmalıdır.');
    }

    const normalizedNegotiationThreshold = dto.isNegotiationEnabled
      ? dto.negotiationThreshold ?? null
      : null;

    if (dto.isNegotiationEnabled && normalizedNegotiationThreshold === null) {
      throw new BadRequestException('Pazarlık eşiği aktifse pazarlık sınırı zorunludur.');
    }

    if (
      normalizedNegotiationThreshold !== null &&
      normalizedNegotiationThreshold < dto.minOrderQuantity
    ) {
      throw new BadRequestException('Pazarlık sınırı, minimum sipariş adedinden küçük olamaz.');
    }

    return this.productsRepository.updateProductListingStepTwo(listing.id, {
      basePrice: minOrderTier.unitPrice,
      currency: 'TRY',
      minOrderQuantity: dto.minOrderQuantity,
      stock: dto.stock,
      isNegotiationEnabled: dto.isNegotiationEnabled,
      negotiationThreshold: normalizedNegotiationThreshold,
      pricingTiers,
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
    const deliveryMethods = this.normalizeDeliveryMethods(dto.deliveryMethods);

    return this.productsRepository.updateProductListingStepThree(listing.id, {
      packageType: dto.packageType,
      leadTimeDays: dto.leadTimeDays,
      shippingTime: dto.shippingTime,
      deliveryMethods,
      dynamicFreightAgreement: dto.dynamicFreightAgreement,
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

  private async buildAdminGrowth(
    period: AdminProductListingGrowthPeriod,
  ): Promise<{ labels: string[]; values: number[] }> {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    const count = 7;
    for (let index = count - 1; index >= 0; index -= 1) {
      let start: Date;
      let end: Date;
      let label: string;

      if (period === 'DAILY') {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - index);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        label = start.toLocaleDateString('tr-TR', { weekday: 'short' });
      } else if (period === 'MONTHLY') {
        start = new Date(now.getFullYear(), now.getMonth() - index, 1);
        end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
        label = start.toLocaleDateString('tr-TR', { month: 'short' });
      } else {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const day = today.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() + mondayOffset);
        start = new Date(currentWeekStart);
        start.setDate(currentWeekStart.getDate() - (index * 7));
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        label = `${start.getDate()}.${start.getMonth() + 1}`;
      }

      const value = await this.productsRepository.countProductListingsCreatedBetween(
        start,
        end,
      );

      labels.push(label);
      values.push(value);
    }

    return { labels, values };
  }

  private normalizePricingTiers(
    tiers: Array<{ minQuantity: number; maxQuantity: number; unitPrice: number }>,
  ): ProductListingPricingTierRecord[] {
    const normalized = tiers.map((tier, index) => ({
      minQuantity: Number(tier.minQuantity),
      maxQuantity: Number(tier.maxQuantity),
      unitPrice: Number(tier.unitPrice),
      index,
    }));

    for (const tier of normalized) {
      if (!Number.isFinite(tier.minQuantity) || !Number.isInteger(tier.minQuantity) || tier.minQuantity < 1) {
        throw new BadRequestException(`Kademe ${tier.index + 1} minimum adedi geçersiz.`);
      }

      if (!Number.isFinite(tier.maxQuantity) || !Number.isInteger(tier.maxQuantity) || tier.maxQuantity < 1) {
        throw new BadRequestException(`Kademe ${tier.index + 1} maksimum adedi geçersiz.`);
      }

      if (tier.maxQuantity < tier.minQuantity) {
        throw new BadRequestException(`Kademe ${tier.index + 1} için maksimum adet minimum adetten küçük olamaz.`);
      }

      if (!Number.isFinite(tier.unitPrice) || tier.unitPrice <= 0) {
        throw new BadRequestException(`Kademe ${tier.index + 1} birim fiyatı 0'dan büyük olmalıdır.`);
      }
    }

    const sorted = [...normalized].sort((a, b) => a.minQuantity - b.minQuantity);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];

      if (current.minQuantity <= previous.maxQuantity) {
        throw new BadRequestException('Kademe aralıkları çakışamaz.');
      }
    }

    return sorted.map(({ minQuantity, maxQuantity, unitPrice }) => ({
      minQuantity,
      maxQuantity,
      unitPrice,
    }));
  }

  private normalizeDeliveryMethods(
    methods: ProductListingDeliveryMethod[],
  ): ProductListingDeliveryMethod[] {
    const normalized = [...new Set(methods)];

    if (normalized.length === 0) {
      throw new BadRequestException('En az bir teslimat yöntemi seçmelisiniz.');
    }

    return normalized;
  }

  private ensureSupplierRole(role: Role): void {
    if (role !== Role.SUPPLIER) {
      throw new ForbiddenException('Bu işlem için satıcı hesabı gereklidir.');
    }
  }

  private ensureAdminRole(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
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

  private async getListingForAdminOrThrow(
    listingId: string,
  ): Promise<ProductListingRecord> {
    const listing = await this.productsRepository.findProductListingById(listingId);

    if (!listing) {
      throw new NotFoundException('Ürün başvurusu bulunamadı.');
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

    if (listing.pricingTiers.length === 0) {
      throw new BadRequestException('Kademeli fiyatlandırma bilgisi zorunludur.');
    }

    if (listing.isNegotiationEnabled && listing.negotiationThreshold === null) {
      throw new BadRequestException('Pazarlık eşiği aktifse pazarlık sınırı zorunludur.');
    }

    if (listing.leadTimeDays === null) {
      throw new BadRequestException('Tedarik süresi bilgisi zorunludur.');
    }

    if (listing.packageType === null) {
      throw new BadRequestException('Paket tipi bilgisi zorunludur.');
    }

    if (listing.shippingTime === null) {
      throw new BadRequestException('Kargoya verilme süresi zorunludur.');
    }

    if (listing.deliveryMethods.length === 0) {
      throw new BadRequestException('En az bir teslimat yöntemi seçmelisiniz.');
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
