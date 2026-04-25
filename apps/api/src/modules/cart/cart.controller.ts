import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: AuthenticatedRequest) {
    const data = await this.cartService.getCart(req.user.sub);

    return {
      success: true,
      data,
      message: 'Sepet başarıyla getirildi.',
    };
  }

  @Post('items')
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddCartItemDto,
  ) {
    const data = await this.cartService.addItem(req.user.sub, req.user.role, dto);

    return {
      success: true,
      data,
      message: 'Ürün sepete eklendi.',
    };
  }

  @Patch('items/:id')
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const data = await this.cartService.updateItem(req.user.sub, id, dto);

    return {
      success: true,
      data,
      message: 'Sepet güncellendi.',
    };
  }

  @Delete('items/:id')
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.cartService.removeItem(req.user.sub, id);

    return {
      success: true,
      data,
      message: 'Ürün sepetten kaldırıldı.',
    };
  }
}
