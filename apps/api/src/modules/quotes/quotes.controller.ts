import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateCounterOfferDto } from './dto/create-counter-offer.dto';
import { QuotesService } from './quotes.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('quotes')
@UseGuards(AuthGuard('jwt'))
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get(':id')
  async getQuoteById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.quotesService.getQuoteById(id, req.user.sub);

    return {
      success: true,
      data,
      message: 'Teklif detayı başarıyla getirildi.',
    };
  }

  @Patch(':id/accept')
  async acceptQuote(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.ensureBuyer(req.user.role);

    const data = await this.quotesService.acceptQuote(id, req.user.sub);

    return {
      success: true,
      data,
      message: 'Teklif kabul edildi.',
    };
  }

  @Patch(':id/reject')
  async rejectQuote(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.ensureBuyer(req.user.role);

    const data = await this.quotesService.rejectQuote(id, req.user.sub);

    return {
      success: true,
      data,
      message: 'Teklif reddedildi.',
    };
  }

  @Post(':id/counter')
  async counterQuote(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCounterOfferDto,
  ) {
    const data = await this.quotesService.createCounterOffer(id, req.user.sub, dto);

    return {
      success: true,
      data,
      message: 'Karşı teklif gönderildi.',
    };
  }

  private ensureBuyer(role: Role): void {
    if (role !== Role.BUYER) {
      throw new ForbiddenException('Bu işlem için alıcı yetkisi gereklidir.');
    }
  }
}
