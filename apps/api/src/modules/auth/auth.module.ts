import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

function parseExpiryToSeconds(value: string): number {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^(\d+)([smhd])?$/);

  if (!match) {
    return 900;
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

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtAccessExpiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

        return {
          secret: configService.get<string>('JWT_SECRET', 'local-dev-secret'),
          signOptions: {
            expiresIn: parseExpiryToSeconds(jwtAccessExpiresIn),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
