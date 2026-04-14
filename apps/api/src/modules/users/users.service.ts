import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserEntity } from './entities/user.entity';
import {
  CreateUserInput,
  UpdateUserProfileInput,
  UserProfile,
  UserWithPassword,
  UsersRepository,
} from './users.repository';

export type CreateUsersServiceInput = CreateUserInput & {
  role?: Role;
};

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    return this.usersRepository.findByEmailWithPassword(email.toLowerCase());
  }

  async createUser(input: CreateUsersServiceInput): Promise<UserEntity> {
    return this.usersRepository.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
    });
  }

  async findProfileById(userId: string): Promise<UserProfile | null> {
    return this.usersRepository.findProfileById(userId);
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    return this.usersRepository.updateProfileById(userId, {
      firstName: this.normalizeOptionalText(input.firstName),
      lastName: this.normalizeOptionalText(input.lastName),
      email: this.normalizeOptionalEmail(input.email),
      phoneNumber: this.normalizeOptionalText(input.phoneNumber),
    });
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeOptionalEmail(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value.trim().toLowerCase();
  }
}
