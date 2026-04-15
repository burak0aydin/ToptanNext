import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    createUser: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string, fallbackValue?: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
      if (key === 'JWT_REFRESH_EXPIRES_IN') {
        return '30d';
      }

      return fallbackValue;
    }),
  };

  const baseUser = {
    id: 'usr_1',
    fullName: 'Test User',
    email: 'buyer@example.com',
    role: Role.BUYER,
    isVerified: false,
    isActive: true,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
  };

  beforeEach(() => {
    service = new AuthService(
      usersServiceMock as unknown as UsersService,
      jwtServiceMock as unknown as JwtService,
      configServiceMock as never,
    );
    jest.clearAllMocks();
  });

  it('should register a new user and return token', async () => {
    usersServiceMock.findByEmailWithPassword.mockResolvedValue(null);
    usersServiceMock.createUser.mockResolvedValue(baseUser);
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('signed-access-token')
      .mockResolvedValueOnce('signed-refresh-token');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      fullName: 'Test User',
      email: 'buyer@example.com',
      password: 'Password123',
      termsAccepted: true,
    });

    expect(usersServiceMock.findByEmailWithPassword).toHaveBeenCalledWith('buyer@example.com');
    expect(usersServiceMock.createUser).toHaveBeenCalledWith({
      fullName: 'Test User',
      email: 'buyer@example.com',
      passwordHash: 'hashed-password',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBe('signed-refresh-token');
  });

  it('should reject register if email already exists', async () => {
    usersServiceMock.findByEmailWithPassword.mockResolvedValue({ id: 'usr_existing' });

    await expect(
      service.register({
        fullName: 'Test User',
        email: 'buyer@example.com',
        password: 'Password123',
        termsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should login and return token for valid credentials', async () => {
    usersServiceMock.findByEmailWithPassword.mockResolvedValue({
      ...baseUser,
      passwordHash: 'hashed-password',
    });
    usersServiceMock.findByEmail.mockResolvedValue(baseUser);
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('signed-access-token')
      .mockResolvedValueOnce('signed-refresh-token');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await service.login({
      email: 'buyer@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBe('signed-refresh-token');
    expect(result.user).toEqual(baseUser);
  });

  it('should reject login when password is invalid', async () => {
    usersServiceMock.findByEmailWithPassword.mockResolvedValue({
      ...baseUser,
      passwordHash: 'hashed-password',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'buyer@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
