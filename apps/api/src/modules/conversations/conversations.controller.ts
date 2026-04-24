import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './conversations.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getConversationList(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter?: 'all' | 'pending_quotes' | 'unread',
    @Query('search') search?: string,
  ) {
    const data = await this.conversationsService.getConversationList(req.user.sub, {
      filter,
      search,
    });

    return {
      success: true,
      data,
      message: 'Konuşma listesi başarıyla getirildi.',
    };
  }

  @Get(':id')
  async getConversationById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.conversationsService.getConversationById(req.user.sub, id);

    return {
      success: true,
      data,
      message: 'Konuşma detayı başarıyla getirildi.',
    };
  }

  @Get(':id/messages')
  async getConversationMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);
    const data = await this.conversationsService.getMessages(
      req.user.sub,
      id,
      cursor,
      Number.isFinite(parsedLimit) ? parsedLimit : 50,
    );

    return {
      success: true,
      data,
      message: 'Mesajlar başarıyla getirildi.',
    };
  }

  @Post()
  async createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto,
  ) {
    const data = await this.conversationsService.createConversation(req.user.sub, dto);

    return {
      success: true,
      data,
      message: 'Konuşma başarıyla oluşturuldu.',
    };
  }

  @Delete(':id')
  async archiveConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.conversationsService.archiveConversation(req.user.sub, id);

    return {
      success: true,
      data: {
        archived: true,
      },
      message: 'Konuşma arşive taşındı.',
    };
  }
}
