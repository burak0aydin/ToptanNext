import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { OrdersService } from './orders.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Req() req: AuthenticatedRequest) {
    const data = await this.ordersService.checkout(req.user.sub, req.user.role);

    return {
      success: true,
      data,
      message: 'Sipariş başarıyla oluşturuldu.',
    };
  }
}
