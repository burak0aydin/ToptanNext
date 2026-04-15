import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReviewSupplierApplicationDto } from './dto/review-supplier-application.dto';
import { UpsertSupplierApplicationContactFinanceDto } from './dto/upsert-supplier-application-contact-finance.dto';
import { UpsertSupplierApplicationDto } from './dto/upsert-supplier-application.dto';
import { SupplierApplicationsService } from './supplier-applications.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('supplier-applications')
@UseGuards(AuthGuard('jwt'))
export class SupplierApplicationsController {
  constructor(
    private readonly supplierApplicationsService: SupplierApplicationsService,
  ) {}

  @Get('me')
  async getMyApplication(@Req() req: AuthenticatedRequest) {
    const data = await this.supplierApplicationsService.findByUserId(
      req.user.sub,
    );

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru bilgileri başarıyla getirildi.',
    };
  }

  @Put('me')
  async upsertMyApplication(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSupplierApplicationDto,
  ) {
    const data = await this.supplierApplicationsService.upsertForUser(
      req.user.sub,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru bilgileri başarıyla kaydedildi.',
    };
  }

  @Put('me/contact-finance')
  async upsertMyContactFinance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSupplierApplicationContactFinanceDto,
  ) {
    const data =
      await this.supplierApplicationsService.upsertContactFinanceForUser(
        req.user.sub,
        dto,
      );

    return {
      success: true,
      data,
      message: 'İletişim ve finans bilgileri başarıyla kaydedildi.',
    };
  }

  @Get('admin')
  async getForAdmin(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req.user.role);

    const data = await this.supplierApplicationsService.findManyForAdmin();

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru listesi başarıyla getirildi.',
    };
  }

  @Put('admin/:id/review')
  async reviewByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewSupplierApplicationDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.supplierApplicationsService.reviewByAdmin(id, dto);

    return {
      success: true,
      data,
      message: 'Tedarikçi başvuru değerlendirmesi başarıyla kaydedildi.',
    };
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
