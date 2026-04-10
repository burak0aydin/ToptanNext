import { Role } from '@prisma/client';

export class UserEntity {
  id: string;
  fullName: string | null;
  email: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: UserEntity) {
    this.id = partial.id;
    this.fullName = partial.fullName;
    this.email = partial.email;
    this.role = partial.role;
    this.isVerified = partial.isVerified;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
