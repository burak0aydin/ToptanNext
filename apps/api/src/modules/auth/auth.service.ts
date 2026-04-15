import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 10;
const DEFAULT_REFRESH_EXPIRES_IN = '30d';

type RefreshJwtPayload = JwtPayload & {
  tokenType: 'refresh';
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
};

function parseExpiryToSeconds(value: string): number {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^(\d+)([smhd])?$/);

  if (!match) {
    return 60 * 60 * 24 * 30;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  if (unit === 's') {
    return amount;
  }
  if (unit === 'm') {
    return amount * 60;
  }
  if (unit === 'h') {
    return amount * 60 * 60;
  }

  return amount * 60 * 60 * 24;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getRefreshTokenMaxAgeSeconds(): number {
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      DEFAULT_REFRESH_EXPIRES_IN,
    );

    return parseExpiryToSeconds(refreshExpiresIn);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.usersService.findByEmailWithPassword(dto.email);
    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi ile kayıtlı bir hesap var.');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const userWithPassword = await this.usersService.findByEmailWithPassword(dto.email);
    if (!userWithPassword) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const passwordMatched = await bcrypt.compare(dto.password, userWithPassword.passwordHash);
    if (!passwordMatched) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bilgileri doğrulanamadı.');
    }

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'local-dev-secret');

    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(refreshToken, {
        secret: jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Oturum yenilenemedi. Lütfen tekrar giriş yapın.');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Geçersiz yenileme oturumu.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return this.signAccessToken(user);
  }

  private async signRefreshToken(user: UserEntity): Promise<string> {
    const payload: RefreshJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'local-dev-secret');

    return this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: this.getRefreshTokenMaxAgeSeconds(),
    });
  }

  private async signAccessToken(user: UserEntity): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
