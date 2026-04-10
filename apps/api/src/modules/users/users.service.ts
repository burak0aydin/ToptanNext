import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput, UserWithPassword, UsersRepository } from './users.repository';

export type CreateUsersServiceInput = CreateUserInput & {
  role?: Role;
};

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
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
}
