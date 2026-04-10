import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
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

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ? new UserEntity(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
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
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new UserEntity(user);
  }
}
