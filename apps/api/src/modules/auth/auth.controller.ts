import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const REFRESH_COOKIE_NAME = 'toptannext_refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(response, result.refreshToken);

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = this.getCookieValue(request, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      throw new UnauthorizedException('Yenileme oturumu bulunamadı.');
    }

    const accessToken = await this.authService.refreshAccessToken(refreshToken);

    return {
      success: true,
      data: {
        accessToken,
      },
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });

    return {
      success: true,
      data: {
        loggedOut: true,
      },
    };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: this.authService.getRefreshTokenMaxAgeSeconds() * 1000,
    });
  }

  private getCookieValue(request: Request, cookieName: string): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookieSegment = cookieHeader
      .split(';')
      .map((segment) => segment.trim())
      .find((segment) => segment.startsWith(`${cookieName}=`));

    if (!cookieSegment) {
      return null;
    }

    const rawValue = cookieSegment.slice(cookieName.length + 1);
    return rawValue ? decodeURIComponent(rawValue) : null;
  }
}
