import {
  Body,
  Controller,
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
import { CreateLogisticsOfferDto } from './dto/create-logistics-offer.dto';
import { ConversationsService } from './conversations.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('logistics')
@UseGuards(AuthGuard('jwt'))
export class LogisticsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('requests/open')
  async getOpenLogisticsRequests(@Req() req: AuthenticatedRequest) {
    const data = await this.conversationsService.getOpenLogisticsRequests(req.user.sub);

    return {
      success: true,
      data,
      message: 'Açık yük ilanları başarıyla getirildi.',
    };
  }

  @Get('offers/me')
  async getMyLogisticsOffers(@Req() req: AuthenticatedRequest) {
    const data = await this.conversationsService.getMyLogisticsOffers(req.user.sub);

    return {
      success: true,
      data,
      message: 'Verdiğiniz teklifler başarıyla getirildi.',
    };
  }

  @Get('requests/:requestId')
  async getLogisticsRequestById(
    @Req() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
  ) {
    const data = await this.conversationsService.getLogisticsRequestById(
      req.user.sub,
      requestId,
    );

    return {
      success: true,
      data,
      message: 'Lojistik talebi başarıyla getirildi.',
    };
  }

  @Post('requests/:requestId/offers')
  async createLogisticsOffer(
    @Req() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
    @Body() dto: CreateLogisticsOfferDto,
  ) {
    const data = await this.conversationsService.createLogisticsOffer(
      req.user.sub,
      requestId,
      dto,
    );

    return {
      success: true,
      data,
      message: 'Lojistik teklifi gönderildi.',
    };
  }

  @Patch('offers/:offerId/select')
  async selectLogisticsOffer(
    @Req() req: AuthenticatedRequest,
    @Param('offerId') offerId: string,
  ) {
    const data = await this.conversationsService.selectLogisticsOffer(
      req.user.sub,
      offerId,
    );

    return {
      success: true,
      data,
      message: 'Lojistik teklifi seçildi.',
    };
  }
}
