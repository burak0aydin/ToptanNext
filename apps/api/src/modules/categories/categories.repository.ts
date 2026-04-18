import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type UpdateCategoryInput = {
  name?: string;
  slug?: string;
  level?: number;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type ReorderCategoryInput = {
  id: string;
  sortOrder: number;
};

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly categorySelect = {
    id: true,
    name: true,
    slug: true,
    level: true,
    parentId: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private async rebalanceSortOrders(
    client: Prisma.TransactionClient | PrismaService,
  ): Promise<void> {
    const categories = await client.category.findMany({
      orderBy: [
        { parentId: 'asc' },
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        parentId: true,
        sortOrder: true,
      },
    });

    const groupMap = new Map<string, typeof categories>();
    for (const category of categories) {
      const key = category.parentId ?? '__ROOT__';
      const current = groupMap.get(key) ?? [];
      current.push(category);
      groupMap.set(key, current);
    }

    const targetSortOrders = new Map<string, number>();
    for (const group of groupMap.values()) {
      group.forEach((category, index) => {
        targetSortOrders.set(category.id, index);
      });
    }

    const updates = categories
      .map((category) => ({
        id: category.id,
        currentSortOrder: category.sortOrder,
        nextSortOrder: targetSortOrders.get(category.id) ?? category.sortOrder,
      }))
      .filter((item) => item.currentSortOrder !== item.nextSortOrder);

    if (updates.length === 0) {
      return;
    }

    const maxSortOrder = categories.reduce(
      (max, category) => Math.max(max, category.sortOrder),
      0,
    );

    let nextTemporarySortOrder = maxSortOrder + 1;

    for (const update of updates) {
      await client.category.update({
        where: { id: update.id },
        data: { sortOrder: nextTemporarySortOrder },
        select: { id: true },
      });

      nextTemporarySortOrder += 1;
    }

    for (const update of updates) {
      await client.category.update({
        where: { id: update.id },
        data: { sortOrder: update.nextSortOrder },
        select: { id: true },
      });
    }
  }

  private async applySortOrderUpdates(
    client: Prisma.TransactionClient,
    items: ReorderCategoryInput[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const maxSortOrder = await client.category.aggregate({
      _max: { sortOrder: true },
    });

    let nextTemporarySortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;

    for (const item of items) {
      await client.category.update({
        where: { id: item.id },
        data: { sortOrder: nextTemporarySortOrder },
        select: { id: true },
      });

      nextTemporarySortOrder += 1;
    }

    for (const item of items) {
      await client.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
        select: { id: true },
      });
    }
  }

  async findById(id: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { id },
      select: this.categorySelect,
    });
  }

  async findBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: this.categorySelect,
    });
  }

  async findAll(options: { includeInactive?: boolean } = {}): Promise<CategoryRecord[]> {
    const includeInactive = options.includeInactive ?? false;

    return this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [
        { level: 'asc' },
        { parentId: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      select: this.categorySelect,
    });
  }

  async findAllActive(): Promise<CategoryRecord[]> {
    return this.findAll({ includeInactive: false });
  }

  async findManyByIds(ids: string[]): Promise<CategoryRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: this.categorySelect,
    });
  }

  async countChildren(parentId: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId } });
  }

  async countProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId } });
  }

  async create(input: CreateCategoryInput): Promise<CategoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          level: input.level,
          parentId: input.parentId,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
        select: this.categorySelect,
      });

      await this.rebalanceSortOrders(tx);

      return tx.category.findUniqueOrThrow({
        where: { id: created.id },
        select: this.categorySelect,
      });
    });
  }

  async updateById(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: input,
        select: this.categorySelect,
      });

      await this.rebalanceSortOrders(tx);

      return tx.category.findUniqueOrThrow({
        where: { id: updated.id },
        select: this.categorySelect,
      });
    });
  }

  async updateSortOrders(items: ReorderCategoryInput[]): Promise<CategoryRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.applySortOrderUpdates(tx, items);

      await this.rebalanceSortOrders(tx);

      return tx.category.findMany({
        where: { id: { in: items.map((item) => item.id) } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: this.categorySelect,
      });
    });
  }

  async deleteById(id: string): Promise<CategoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.category.delete({
        where: { id },
        select: this.categorySelect,
      });

      await this.rebalanceSortOrders(tx);

      return deleted;
    });
  }
}
