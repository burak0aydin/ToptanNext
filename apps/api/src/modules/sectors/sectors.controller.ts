import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { SectorsService } from './sectors.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get()
  async getAll() {
    const data = await this.sectorsService.getAllActive();

    return {
      success: true,
      data,
      message: 'Sektör listesi başarıyla getirildi.',
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSectorDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.sectorsService.create(dto);

    return {
      success: true,
      data,
      message: 'Sektör başarıyla oluşturuldu.',
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSectorDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.sectorsService.update(id, dto);

    return {
      success: true,
      data,
      message: 'Sektör başarıyla güncellendi.',
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req.user.role);

    const data = await this.sectorsService.delete(id);

    return {
      success: true,
      data,
      message: 'Sektör başarıyla silindi.',
    };
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
