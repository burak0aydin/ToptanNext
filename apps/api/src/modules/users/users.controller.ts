import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const profile = await this.usersService.findProfileById(req.user.sub);

    if (!profile) {
      throw new NotFoundException('Kullanıcı profili bulunamadı.');
    }

    return {
      success: true,
      data: profile,
    };
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(req.user.sub, dto);

    return {
      success: true,
      data: profile,
    };
  }
}
