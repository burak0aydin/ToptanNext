import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  NotFoundException,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpdateUserActiveStatusDto } from './dto/update-user-active-status.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/management')
  async getAdminManagement(
    @Req() req: AuthenticatedRequest,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    this.ensureAdmin(req.user.role);

    const normalizedPeriod =
      period === 'WEEKLY' || period === 'MONTHLY' ? period : 'DAILY';

    const numericPage = Number(page);
    const numericLimit = Number(limit);

    const normalizedRole =
      role === 'ADMIN' || role === 'SUPPLIER' || role === 'BUYER'
        ? role
        : undefined;

    const normalizedStatus =
      status === 'ACTIVE' || status === 'BANNED' ? status : 'ALL';

    const data = await this.usersService.getAdminUserManagement({
      requesterRole: req.user.role,
      page: Number.isFinite(numericPage) ? numericPage : 1,
      limit: Number.isFinite(numericLimit) ? numericLimit : 10,
      period: normalizedPeriod,
      search: search?.trim() || undefined,
      role: normalizedRole,
      status: normalizedStatus,
    });

    return {
      success: true,
      data,
    };
  }

  @Get('admin/:id')
  async getAdminUserDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.usersService.getAdminUserById(req.user.role, id);

    return {
      success: true,
      data,
    };
  }

  @Patch('admin/:id/active')
  async updateAdminUserActiveStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveStatusDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.usersService.updateAdminUserActiveStatus(
      req.user.role,
      req.user.sub,
      id,
      dto.isActive,
    );

    return {
      success: true,
      data,
    };
  }

  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const profile = await this.usersService.findProfileById(req.user.sub);

    if (!profile) {
      throw new NotFoundException('Kullanıcı profili bulunamadı.');
    }

    return {
      success: true,
      data: profile,
    };
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(req.user.sub, dto);

    return {
      success: true,
      data: profile,
    };
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
