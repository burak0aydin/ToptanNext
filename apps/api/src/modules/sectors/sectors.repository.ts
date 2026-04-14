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

@Injectable()
export class SectorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<SectorRecord[]> {
    return this.prisma.sector.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<SectorRecord | null> {
    return this.prisma.sector.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<SectorRecord | null> {
    return this.prisma.sector.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(input: CreateSectorInput): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.sector.create({
        data: input,
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async updateById(id: string, input: UpdateSectorInput): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.sector.update({
        where: { id },
        data: input,
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async deleteById(id: string): Promise<SectorRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.sector.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }
}
