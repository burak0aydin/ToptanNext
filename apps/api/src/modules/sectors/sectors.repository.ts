import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SectorRecord = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSectorInput = {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type UpdateSectorInput = {
  name?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type ReorderSectorInput = {
  id: string;
  sortOrder: number;
};

@Injectable()
export class SectorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sectorSelect = {
    id: true,
    name: true,
    slug: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private async rebalanceSortOrders(
    client: Prisma.TransactionClient | PrismaService,
  ): Promise<void> {
    const sectors = await client.sector.findMany({
      orderBy: [
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        sortOrder: true,
      },
    });

    const updates = sectors
      .map((sector, index) => ({
        id: sector.id,
        currentSortOrder: sector.sortOrder,
        nextSortOrder: index,
      }))
      .filter((item) => item.currentSortOrder !== item.nextSortOrder);

    if (updates.length === 0) {
      return;
    }

    const maxSortOrder = sectors.reduce(
      (max, sector) => Math.max(max, sector.sortOrder),
      0,
    );

    let nextTemporarySortOrder = maxSortOrder + 1;

    for (const update of updates) {
      await client.sector.update({
        where: { id: update.id },
        data: { sortOrder: nextTemporarySortOrder },
        select: { id: true },
      });

      nextTemporarySortOrder += 1;
    }

    for (const update of updates) {
      await client.sector.update({
        where: { id: update.id },
        data: { sortOrder: update.nextSortOrder },
        select: { id: true },
      });
    }
  }

  private async applySortOrderUpdates(
    client: Prisma.TransactionClient,
    items: ReorderSectorInput[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const maxSortOrder = await client.sector.aggregate({
      _max: { sortOrder: true },
    });

    let nextTemporarySortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;

    for (const item of items) {
      await client.sector.update({
        where: { id: item.id },
        data: { sortOrder: nextTemporarySortOrder },
        select: { id: true },
      });

      nextTemporarySortOrder += 1;
    }

    for (const item of items) {
      await client.sector.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
        select: { id: true },
      });
    }
  }

  async findAll(options: { includeInactive?: boolean } = {}): Promise<SectorRecord[]> {
    const includeInactive = options.includeInactive ?? false;

    return this.prisma.sector.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: this.sectorSelect,
    });
  }

  async findAllActive(): Promise<SectorRecord[]> {
    return this.findAll({ includeInactive: false });
  }

  async findById(id: string): Promise<SectorRecord | null> {
    return this.prisma.sector.findUnique({
      where: { id },
      select: this.sectorSelect,
    });
  }

  async findBySlug(slug: string): Promise<SectorRecord | null> {
    return this.prisma.sector.findUnique({
      where: { slug },
      select: this.sectorSelect,
    });
  }

  async findManyByIds(ids: string[]): Promise<SectorRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.sector.findMany({
      where: { id: { in: ids } },
      select: this.sectorSelect,
    });
  }

  async create(input: CreateSectorInput): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.sector.create({
        data: input,
        select: this.sectorSelect,
      });

      await this.rebalanceSortOrders(tx);

      return tx.sector.findUniqueOrThrow({
        where: { id: created.id },
        select: this.sectorSelect,
      });
    });
  }

  async updateById(id: string, input: UpdateSectorInput): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sector.update({
        where: { id },
        data: input,
        select: this.sectorSelect,
      });

      await this.rebalanceSortOrders(tx);

      return tx.sector.findUniqueOrThrow({
        where: { id: updated.id },
        select: this.sectorSelect,
      });
    });
  }

  async updateSortOrders(items: ReorderSectorInput[]): Promise<SectorRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.applySortOrderUpdates(tx, items);

      await this.rebalanceSortOrders(tx);

      return tx.sector.findMany({
        where: { id: { in: items.map((item) => item.id) } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: this.sectorSelect,
      });
    });
  }

  async deleteById(id: string): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.sector.delete({
        where: { id },
        select: this.sectorSelect,
      });

      await this.rebalanceSortOrders(tx);

      return deleted;
    });
  }
}
