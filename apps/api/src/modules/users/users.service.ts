import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserEntity } from './entities/user.entity';
import {
  AdminUserListFilters,
  CreateUserInput,
  UpdateUserProfileInput,
  UserProfile,
  UserWithPassword,
  UsersRepository,
} from './users.repository';

export type CreateUsersServiceInput = CreateUserInput & {
  role?: Role;
};

type AdminUserManagementPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

type AdminUserStatusFilter = 'ALL' | 'ACTIVE' | 'BANNED';

export type AdminUserManagementQueryInput = {
  requesterRole: Role;
  page: number;
  limit: number;
  period: AdminUserManagementPeriod;
  search?: string;
  role?: Role;
  status?: AdminUserStatusFilter;
};

export type AdminUserListItem = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserManagementResult = {
  summary: {
    totalUsers: number;
    growthRatePercent: number;
  };
  growth: {
    period: AdminUserManagementPeriod;
    labels: string[];
    values: number[];
  };
  users: {
    items: AdminUserListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private ensureAdminRole(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

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

  async updateRole(userId: string, role: Role): Promise<UserEntity> {
    return this.usersRepository.updateRoleById(userId, role);
  }

  async getAdminUserManagement(
    input: AdminUserManagementQueryInput,
  ): Promise<AdminUserManagementResult> {
    this.ensureAdminRole(input.requesterRole);

    const page = Math.max(1, input.page);
    const limit = Math.min(Math.max(input.limit, 5), 100);
    const skip = (page - 1) * limit;

    const listFilters: AdminUserListFilters = {
      search: input.search,
      role: input.role,
      isActive:
        input.status === 'ACTIVE'
          ? true
          : input.status === 'BANNED'
            ? false
            : undefined,
      skip,
      take: limit,
    };

    const [totalUsers, listResult, growth] = await Promise.all([
      this.usersRepository.countUsers(),
      this.usersRepository.findManyForAdmin(listFilters),
      this.calculateUserGrowth(input.period),
    ]);

    return {
      summary: {
        totalUsers,
        growthRatePercent: growth.growthRatePercent,
      },
      growth: {
        period: input.period,
        labels: growth.labels,
        values: growth.values,
      },
      users: {
        items: listResult.items.map((item) => ({
          id: item.id,
          fullName: item.fullName,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          role: item.role,
          isActive: item.isActive,
          isVerified: item.isVerified,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        total: listResult.total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(listResult.total / limit)),
      },
    };
  }

  async getAdminUserById(
    requesterRole: Role,
    userId: string,
  ): Promise<UserEntity> {
    this.ensureAdminRole(requesterRole);

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    return user;
  }

  async updateAdminUserActiveStatus(
    requesterRole: Role,
    requesterUserId: string,
    targetUserId: string,
    isActive: boolean,
  ): Promise<UserEntity> {
    this.ensureAdminRole(requesterRole);

    if (targetUserId === requesterUserId) {
      throw new BadRequestException('Kendi hesabınızı bu ekrandan banlayamazsınız.');
    }

    const existingUser = await this.usersRepository.findById(targetUserId);
    if (!existingUser) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (existingUser.role === Role.ADMIN) {
      throw new BadRequestException(
        'Admin kullanıcıların durumu bu ekrandan değiştirilemez.',
      );
    }

    return this.usersRepository.updateActiveStatusById(targetUserId, isActive);
  }

  private async calculateUserGrowth(period: AdminUserManagementPeriod): Promise<{
    labels: string[];
    values: number[];
    growthRatePercent: number;
  }> {
    const now = new Date();

    if (period === 'WEEKLY') {
      return this.calculateWeeklyGrowth(now);
    }

    if (period === 'MONTHLY') {
      return this.calculateMonthlyGrowth(now);
    }

    return this.calculateDailyGrowth(now);
  }

  private async calculateDailyGrowth(now: Date): Promise<{
    labels: string[];
    values: number[];
    growthRatePercent: number;
  }> {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const currentStart = new Date(dayStart);
    currentStart.setDate(currentStart.getDate() - 6);
    const currentEnd = new Date(dayStart);
    currentEnd.setDate(currentEnd.getDate() + 1);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(currentStart);

    const [records, currentCount, previousCount] = await Promise.all([
      this.usersRepository.findUserCreatedAtBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(previousStart, previousEnd),
    ]);

    const labels: string[] = [];
    const values: number[] = [];
    const labelFormatter = new Intl.DateTimeFormat('tr-TR', {
      weekday: 'short',
    });

    for (let index = 0; index < 7; index += 1) {
      const start = new Date(currentStart);
      start.setDate(currentStart.getDate() + index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      labels.push(this.toTitleCase(labelFormatter.format(start)));
      values.push(
        records.filter(
          (record) => record.createdAt >= start && record.createdAt < end,
        ).length,
      );
    }

    return {
      labels,
      values,
      growthRatePercent: this.calculateGrowthRate(currentCount, previousCount),
    };
  }

  private async calculateWeeklyGrowth(now: Date): Promise<{
    labels: string[];
    values: number[];
    growthRatePercent: number;
  }> {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentStart = new Date(currentWeekStart);
    currentStart.setDate(currentWeekStart.getDate() - 7 * 7);
    const currentEnd = new Date(currentWeekStart);
    currentEnd.setDate(currentWeekStart.getDate() + 7);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 8 * 7);
    const previousEnd = new Date(currentStart);

    const [records, currentCount, previousCount] = await Promise.all([
      this.usersRepository.findUserCreatedAtBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(previousStart, previousEnd),
    ]);

    const labels: string[] = [];
    const values: number[] = [];
    for (let index = 0; index < 8; index += 1) {
      const start = new Date(currentStart);
      start.setDate(currentStart.getDate() + index * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      labels.push(`H${index + 1}`);
      values.push(
        records.filter(
          (record) => record.createdAt >= start && record.createdAt < end,
        ).length,
      );
    }

    return {
      labels,
      values,
      growthRatePercent: this.calculateGrowthRate(currentCount, previousCount),
    };
  }

  private async calculateMonthlyGrowth(now: Date): Promise<{
    labels: string[];
    values: number[];
    growthRatePercent: number;
  }> {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 11, 1);
    const currentEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 12, 1);
    const previousEnd = new Date(currentStart);

    const [records, currentCount, previousCount] = await Promise.all([
      this.usersRepository.findUserCreatedAtBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(currentStart, currentEnd),
      this.usersRepository.countUsersBetween(previousStart, previousEnd),
    ]);

    const labels: string[] = [];
    const values: number[] = [];
    const formatter = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

    for (let index = 0; index < 12; index += 1) {
      const start = new Date(currentStart.getFullYear(), currentStart.getMonth() + index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

      labels.push(this.toTitleCase(formatter.format(start)));
      values.push(
        records.filter(
          (record) => record.createdAt >= start && record.createdAt < end,
        ).length,
      );
    }

    return {
      labels,
      values,
      growthRatePercent: this.calculateGrowthRate(currentCount, previousCount),
    };
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private toTitleCase(value: string): string {
    if (value.length === 0) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
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
