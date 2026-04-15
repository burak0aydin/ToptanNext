import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
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
    const data = await this.supplierApplicationsService.findByUserId(req.user.sub);

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
}
