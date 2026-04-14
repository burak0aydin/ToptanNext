import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryRecord,
  CategoriesRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './categories.repository';

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryTreeNode[];
};

export type CategoryFlatNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parent_id: string | null;
  parent_name: string | null;
  root_name: string;
  breadcrumb: string;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async getTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.categoriesRepository.findAllActive();
    const map = new Map<string, CategoryTreeNode>();

    categories.forEach((category) => {
      map.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        children: [],
      });
    });

    const roots: CategoryTreeNode[] = [];

    categories.forEach((category) => {
      const node = map.get(category.id);
      if (!node) {
        return;
      }

      if (!category.parentId) {
        roots.push(node);
        return;
      }

      const parentNode = map.get(category.parentId);
      if (!parentNode) {
        return;
      }

      parentNode.children.push(node);
    });

    return roots;
  }

  async getFlat(leafOnly = true): Promise<CategoryFlatNode[]> {
    const categories = await this.categoriesRepository.findAllActive();
    const categoryMap = new Map<string, CategoryRecord>();

    categories.forEach((category) => {
      categoryMap.set(category.id, category);
    });

    const filtered = leafOnly
      ? categories.filter((category) => category.level === 3)
      : categories;

    return filtered.map((category) => {
      const parent = category.parentId ? categoryMap.get(category.parentId) ?? null : null;

      let rootName = category.name;
      let breadcrumbParts = [category.name];
      let cursor = category;

      while (cursor.parentId) {
        const parentNode = categoryMap.get(cursor.parentId);
        if (!parentNode) {
          break;
        }

        breadcrumbParts = [parentNode.name, ...breadcrumbParts];
        rootName = parentNode.name;
        cursor = parentNode;
      }

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        parent_id: category.parentId,
        parent_name: parent?.name ?? null,
        root_name: rootName,
        breadcrumb: breadcrumbParts.join(' > '),
      };
    });
  }

  async getById(id: string): Promise<CategoryRecord> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryRecord> {
    const normalizedName = this.normalizeRequiredText(dto.name, 'Kategori adı boş olamaz.');

    const parent = await this.resolveParent(dto.parentId ?? null);
    const level = parent ? parent.level + 1 : 1;

    if (level > 3) {
      throw new UnprocessableEntityException('Kategori en fazla 3 seviyeli olabilir.');
    }

    const slug = await this.generateUniqueSlug(normalizedName, parent?.slug ?? null);

    const input: CreateCategoryInput = {
      name: normalizedName,
      slug,
      level,
      parentId: parent?.id ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    };

    return this.categoriesRepository.create(input);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRecord> {
    const current = await this.getById(id);
    const input: UpdateCategoryInput = {};

    const parentChanged = dto.parentId !== undefined && dto.parentId !== current.parentId;

    if (parentChanged) {
      const childCount = await this.categoriesRepository.countChildren(id);
      if (childCount > 0) {
        throw new UnprocessableEntityException(
          'Alt kategorisi olan bir kategori başka bir üst kategoriye taşınamaz.',
        );
      }

      if (dto.parentId === id) {
        throw new UnprocessableEntityException('Kategori kendisini üst kategori seçemez.');
      }

      const parent = await this.resolveParent(dto.parentId ?? null);
      const level = parent ? parent.level + 1 : 1;

      if (level > 3) {
        throw new UnprocessableEntityException('Kategori en fazla 3 seviyeli olabilir.');
      }

      input.parentId = parent?.id ?? null;
      input.level = level;

      const targetName = this.normalizeOptionalText(dto.name) ?? current.name;
      input.slug = await this.generateUniqueSlug(
        targetName,
        parent?.slug ?? null,
        current.id,
      );
    } else if (dto.name !== undefined) {
      const normalizedName = this.normalizeRequiredText(dto.name, 'Kategori adı boş olamaz.');
      input.name = normalizedName;

      const parent = current.parentId
        ? await this.categoriesRepository.findById(current.parentId)
        : null;

      input.slug = await this.generateUniqueSlug(
        normalizedName,
        parent?.slug ?? null,
        current.id,
      );
    }

    if (dto.sortOrder !== undefined) {
      input.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      input.isActive = dto.isActive;
    }

    if (input.slug && !input.name) {
      input.name = current.name;
    }

    if (Object.keys(input).length === 0) {
      return current;
    }

    return this.categoriesRepository.updateById(id, input);
  }

  async delete(id: string): Promise<CategoryRecord> {
    await this.getById(id);

    const childCount = await this.categoriesRepository.countChildren(id);
    if (childCount > 0) {
      throw new UnprocessableEntityException('Önce alt kategorileri silmelisiniz.');
    }

    const productCount = await this.categoriesRepository.countProducts(id);
    if (productCount > 0) {
      throw new UnprocessableEntityException('Bu kategoriye bağlı ürünler bulunduğu için silinemez.');
    }

    return this.categoriesRepository.deleteById(id);
  }

  private async resolveParent(parentId: string | null): Promise<CategoryRecord | null> {
    if (!parentId) {
      return null;
    }

    const parent = await this.categoriesRepository.findById(parentId);

    if (!parent) {
      throw new NotFoundException('Üst kategori bulunamadı.');
    }

    if (parent.level >= 3) {
      throw new UnprocessableEntityException(
        'Level 3 kategori altına yeni kategori eklenemez.',
      );
    }

    return parent;
  }

  private normalizeRequiredText(value: string, message: string): string {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.normalizeRequiredText(value, 'Kategori adı boş olamaz.');
  }

  private async generateUniqueSlug(
    categoryName: string,
    parentSlug: string | null,
    skipCategoryId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(categoryName);
    const scopedBaseSlug = parentSlug ? `${parentSlug}-${baseSlug}` : baseSlug;

    let candidate = scopedBaseSlug;
    let index = 2;

    while (true) {
      const existing = await this.categoriesRepository.findBySlug(candidate);

      if (!existing || existing.id === skipCategoryId) {
        return candidate;
      }

      candidate = `${scopedBaseSlug}-${index}`;
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
