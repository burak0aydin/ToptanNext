import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 10;

export type AuthResult = {
  accessToken: string;
  user: UserEntity;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

    return {
      accessToken,
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

    return {
      accessToken,
      user,
    };
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
