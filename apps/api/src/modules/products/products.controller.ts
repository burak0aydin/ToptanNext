import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll() {
    const data = await this.productsService.getAll();

    return {
      success: true,
      data,
      message: 'Ürün listesi başarıyla getirildi.',
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() _req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.productsService.create(dto);

    return {
      success: true,
      data,
      message: 'Ürün başarıyla oluşturuldu.',
    };
  }
}
