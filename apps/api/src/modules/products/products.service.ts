import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import {
  CreateProductInput,
  ProductRecord,
  ProductsRepository,
} from './products.repository';

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

  private normalizeRequiredText(value: string, message: string): string {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException(message);
    }

    return normalized;
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
