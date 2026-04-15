import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    getRefreshTokenMaxAgeSeconds: jest.fn().mockReturnValue(60 * 60 * 24 * 30),
  };

  const baseUser = {
    id: 'usr_1',
    email: 'buyer@example.com',
    role: Role.BUYER,
    isVerified: false,
    isActive: true,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should call register and wrap response', async () => {
    const responseMock = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authServiceMock.register.mockResolvedValue({
      accessToken: 'signed-token',
      refreshToken: 'refresh-token',
      user: baseUser,
    });

    const result = await controller.register(
      {
        fullName: 'Test User',
        email: 'buyer@example.com',
        password: 'Password123',
        termsAccepted: true,
      },
      responseMock as never,
    );

    expect(authServiceMock.register).toHaveBeenCalled();
    expect(responseMock.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: {
        accessToken: 'signed-token',
        user: baseUser,
      },
    });
  });

  it('should call login and wrap response', async () => {
    const responseMock = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authServiceMock.login.mockResolvedValue({
      accessToken: 'signed-token',
      refreshToken: 'refresh-token',
      user: baseUser,
    });

    const result = await controller.login(
      {
        email: 'buyer@example.com',
        password: 'Password123',
      },
      responseMock as never,
    );

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      password: 'Password123',
    });
    expect(responseMock.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: {
        accessToken: 'signed-token',
        user: baseUser,
      },
    });
  });
});
