import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getTree() {
    const data = await this.categoriesService.getTree();

    return {
      success: true,
      data,
      message: 'Kategori ağacı başarıyla getirildi.',
    };
  }

  @Get('admin/tree')
  @UseGuards(AuthGuard('jwt'))
  async getAdminTree(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req.user.role);

    const data = await this.categoriesService.getAdminTree();

    return {
      success: true,
      data,
      message: 'Yönetim için kategori ağacı başarıyla getirildi.',
    };
  }

  @Get('flat')
  async getFlat(@Query('leafOnly') leafOnly?: string) {
    const onlyLeaf = leafOnly === undefined ? true : leafOnly !== 'false';
    const data = await this.categoriesService.getFlat(onlyLeaf);

    return {
      success: true,
      data,
      message: 'Kategori listesi başarıyla getirildi.',
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.categoriesService.getById(id);

    return {
      success: true,
      data,
      message: 'Kategori detayı başarıyla getirildi.',
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.categoriesService.create(dto);

    return {
      success: true,
      data,
      message: 'Kategori başarıyla oluşturuldu.',
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.categoriesService.update(id, dto);

    return {
      success: true,
      data,
      message: 'Kategori başarıyla güncellendi.',
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req.user.role);

    const data = await this.categoriesService.delete(id);

    return {
      success: true,
      data,
      message: 'Kategori başarıyla silindi.',
    };
  }

  @Put('admin/reorder')
  @UseGuards(AuthGuard('jwt'))
  async reorder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReorderCategoriesDto,
  ) {
    this.ensureAdmin(req.user.role);

    const data = await this.categoriesService.reorder(dto);

    return {
      success: true,
      data,
      message: 'Kategori sıralaması başarıyla güncellendi.',
    };
  }

  private ensureAdmin(role: Role): void {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Bu işlem için admin yetkisi gereklidir.');
    }
  }
}
