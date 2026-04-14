import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CategorySummary = {
  id: string;
  name: string;
  level: number;
  isActive: boolean;
};

export type SectorSummary = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  sectorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductInput = {
  name: string;
  slug: string;
  categoryId: string;
  sectorId: string | null;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductRecord | null> {
    return this.prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        sectorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findCategoryById(categoryId: string): Promise<CategorySummary | null> {
    return this.prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        level: true,
        isActive: true,
      },
    });
  }

  async findSectorById(sectorId: string): Promise<SectorSummary | null> {
    return this.prisma.sector.findUnique({
      where: { id: sectorId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }

  async create(input: CreateProductInput): Promise<ProductRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          categoryId: input.categoryId,
          sectorId: input.sectorId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          sectorId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async findAll(): Promise<ProductRecord[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        sectorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
