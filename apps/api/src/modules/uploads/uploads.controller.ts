import {
  Controller,
  BadRequestException,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('chat-attachments')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatAttachment(
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Dosya bulunamadı.');
    }

    const data = await this.uploadsService.uploadChatAttachment(file);

    return {
      success: true,
      data,
      message: 'Dosya başarıyla yüklendi.',
    };
  }
}
