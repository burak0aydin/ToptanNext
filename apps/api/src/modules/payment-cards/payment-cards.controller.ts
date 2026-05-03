import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreatePaymentCardDto, PaymentCardsService, UpdatePaymentCardDto } from './payment-cards.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('payment-cards')
@UseGuards(AuthGuard('jwt'))
export class PaymentCardsController {
  constructor(private readonly paymentCardsService: PaymentCardsService) {}

  @Post()
  async createCard(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreatePaymentCardDto,
  ) {
    const card = await this.paymentCardsService.createCard(req.user.sub, data);

    return {
      success: true,
      data: card,
      message: 'Kart başarıyla kaydedildi.',
    };
  }

  @Get()
  async getUserCards(@Req() req: AuthenticatedRequest) {
    const cards = await this.paymentCardsService.getUserCards(req.user.sub);

    return {
      success: true,
      data: cards,
    };
  }

  @Delete(':id')
  async deleteCard(
    @Req() req: AuthenticatedRequest,
    @Param('id') cardId: string,
  ) {
    await this.paymentCardsService.deleteCard(cardId, req.user.sub);

    return {
      success: true,
      data: null,
      message: 'Kart başarıyla silindi.',
    };
  }

  @Put(':id')
  async updateCard(
    @Req() req: AuthenticatedRequest,
    @Param('id') cardId: string,
    @Body() data: UpdatePaymentCardDto,
  ) {
    const card = await this.paymentCardsService.updateCard(cardId, req.user.sub, data);

    return {
      success: true,
      data: card,
      message: 'Kart başarıyla güncellendi.',
    };
  }

  @Put(':id/select')
  async selectCard(
    @Req() req: AuthenticatedRequest,
    @Param('id') cardId: string,
  ) {
    const card = await this.paymentCardsService.selectCard(cardId, req.user.sub);

    return {
      success: true,
      data: card,
      message: 'Geçerli kart güncellendi.',
    };
  }
}
