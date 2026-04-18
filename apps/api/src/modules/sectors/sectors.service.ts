import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { ReorderSectorsDto } from './dto/reorder-sectors.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import {
  CreateSectorInput,
  ReorderSectorInput,
  SectorRecord,
  SectorsRepository,
  UpdateSectorInput,
} from './sectors.repository';

const APPEND_SORT_ORDER = 2_147_483_647;

@Injectable()
export class SectorsService {
  constructor(private readonly sectorsRepository: SectorsRepository) {}

  async getAll(includeInactive = false): Promise<SectorRecord[]> {
    return this.sectorsRepository.findAll({ includeInactive });
  }

  async getAllActive(): Promise<SectorRecord[]> {
    return this.getAll(false);
  }

  async getAllForAdmin(): Promise<SectorRecord[]> {
    return this.getAll(true);
  }

  async getById(id: string): Promise<SectorRecord> {
    const sector = await this.sectorsRepository.findById(id);

    if (!sector) {
      throw new NotFoundException('Sektör bulunamadı.');
    }

    return sector;
  }

  async create(dto: CreateSectorDto): Promise<SectorRecord> {
    const name = this.normalizeRequiredText(dto.name);
    const slug = await this.generateUniqueSlug(name);

    const input: CreateSectorInput = {
      name,
      slug,
      sortOrder: dto.sortOrder ?? APPEND_SORT_ORDER,
      isActive: dto.isActive ?? true,
    };

    return this.sectorsRepository.create(input);
  }

  async update(id: string, dto: UpdateSectorDto): Promise<SectorRecord> {
    const current = await this.getById(id);
    const input: UpdateSectorInput = {};

    if (dto.name !== undefined) {
      const name = this.normalizeRequiredText(dto.name);
      input.name = name;
      input.slug = await this.generateUniqueSlug(name, current.id);
    }

    if (dto.sortOrder !== undefined) {
      input.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      input.isActive = dto.isActive;
    }

    if (Object.keys(input).length === 0) {
      return current;
    }

    return this.sectorsRepository.updateById(id, input);
  }

  async delete(id: string): Promise<SectorRecord> {
    await this.getById(id);
    return this.sectorsRepository.deleteById(id);
  }

  async reorder(dto: ReorderSectorsDto): Promise<SectorRecord[]> {
    const ids = dto.items.map((item) => item.id);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Aynı sektör birden fazla kez gönderilemez.');
    }

    const existing = await this.sectorsRepository.findManyByIds([...uniqueIds]);
    if (existing.length !== uniqueIds.size) {
      const existingIds = new Set(existing.map((item) => item.id));
      const missingIds = [...uniqueIds].filter((id) => !existingIds.has(id));

      throw new NotFoundException(
        `Bazı sektörler bulunamadı: ${missingIds.join(', ')}`,
      );
    }

    const reorderInput: ReorderSectorInput[] = dto.items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
    }));

    return this.sectorsRepository.updateSortOrders(reorderInput);
  }

  private normalizeRequiredText(value: string): string {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException('Sektör adı boş olamaz.');
    }

    return normalized;
  }

  private async generateUniqueSlug(name: string, skipId?: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let candidate = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.sectorsRepository.findBySlug(candidate);
      if (!existing || existing.id === skipId) {
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
