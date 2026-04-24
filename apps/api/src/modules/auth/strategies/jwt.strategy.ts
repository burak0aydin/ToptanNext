import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT secret tanımlı değil.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const userById = await this.usersService.findById(payload.sub);
    if (userById && userById.isActive) {
      return payload;
    }

    // DB geri yükleme/taşıma sonrası eski token'lardaki "sub" değişmiş olabilir.
    // E-posta ile tekrar eşleyip oturumu düşürmeden toparlıyoruz.
    const userByEmail = await this.usersService.findByEmail(payload.email);
    if (!userByEmail || !userByEmail.isActive) {
      throw new UnauthorizedException('Geçersiz oturum. Lütfen tekrar giriş yapın.');
    }

    return {
      sub: userByEmail.id,
      email: userByEmail.email,
      role: userByEmail.role,
    };
  }
}
