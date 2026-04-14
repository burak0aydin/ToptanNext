import { Role } from '@prisma/client';

export class UserEntity {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: UserEntity) {
    this.id = partial.id;
    this.fullName = partial.fullName;
    this.firstName = partial.firstName;
    this.lastName = partial.lastName;
    this.email = partial.email;
    this.phoneNumber = partial.phoneNumber;
    this.role = partial.role;
    this.isVerified = partial.isVerified;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
