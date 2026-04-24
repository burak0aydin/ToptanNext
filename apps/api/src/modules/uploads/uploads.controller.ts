import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { UploadsService } from './uploads.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('presigned-url')
  @UseGuards(AuthGuard('jwt'))
  async getPresignedUrl(
    @Req() _req: AuthenticatedRequest,
    @Query() dto: GetPresignedUrlDto,
  ) {
    const data = await this.uploadsService.getPresignedUrl(dto);

    return {
      success: true,
      data,
      message: 'Yükleme URL bilgisi başarıyla oluşturuldu.',
    };
  }
}
