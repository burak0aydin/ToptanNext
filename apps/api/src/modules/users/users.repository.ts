import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from './entities/user.entity';

export type CreateUserInput = {
  fullName?: string;
  email: string;
  passwordHash: string;
  role?: Role;
};

export type UserWithPassword = {
  id: string;
  fullName: string | null;
  email: string;
  passwordHash: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
};

export type UserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateUserProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  phoneNumber?: string | null;
};

export type AdminUserListFilters = {
  search?: string;
  role?: Role;
  isActive?: boolean;
  skip: number;
  take: number;
};

export type AdminUserListResult = {
  total: number;
  items: UserEntity[];
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userEntitySelect = {
    id: true,
    fullName: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    role: true,
    isVerified: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private buildAdminUserWhereInput(
    input: Omit<AdminUserListFilters, 'skip' | 'take'>,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (input.role) {
      where.role = input.role;
    }

    if (typeof input.isActive === 'boolean') {
      where.isActive = input.isActive;
    }

    if (input.search && input.search.trim().length > 0) {
      const search = input.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async updateRoleById(id: string, role: Role): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: this.userEntitySelect,
    });

    return new UserEntity(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userEntitySelect,
    });

    return user ? new UserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.userEntitySelect,
    });

    return user ? new UserEntity(user) : null;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isActive: true,
      },
    });
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? Role.BUYER,
      },
      select: this.userEntitySelect,
    });

    return new UserEntity(user);
  }

  async findProfileById(userId: string): Promise<UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfileById(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    const data = {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phoneNumber !== undefined
        ? { phoneNumber: input.phoneNumber }
        : {}),
    };

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findManyForAdmin(
    input: AdminUserListFilters,
  ): Promise<AdminUserListResult> {
    const where = this.buildAdminUserWhereInput({
      search: input.search,
      role: input.role,
      isActive: input.isActive,
    });

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.skip,
        take: input.take,
        select: this.userEntitySelect,
      }),
    ]);

    return {
      total,
      items: users.map((user) => new UserEntity(user)),
    };
  }

  async updateActiveStatusById(
    id: string,
    isActive: boolean,
  ): Promise<UserEntity> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: this.userEntitySelect,
    });

    return new UserEntity(updatedUser);
  }

  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async countUsersBetween(start: Date, end: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });
  }

  async findUserCreatedAtBetween(
    start: Date,
    end: Date,
  ): Promise<Array<{ createdAt: Date }>> {
    return this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        createdAt: true,
      },
    });
  }
}
