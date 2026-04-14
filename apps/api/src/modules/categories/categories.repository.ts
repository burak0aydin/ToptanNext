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

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllActive(): Promise<CategoryRecord[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
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
      return tx.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          level: input.level,
          parentId: input.parentId,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          parentId: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async updateById(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.category.update({
        where: { id },
        data: input,
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          parentId: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async deleteById(id: string): Promise<CategoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.category.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          parentId: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }
}
