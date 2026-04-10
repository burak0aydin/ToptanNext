import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepositoryMock = {
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should normalize email before findByEmail', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(null);

    await service.findByEmail('TEST@Example.COM');

    expect(usersRepositoryMock.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should normalize email before findByEmailWithPassword', async () => {
    usersRepositoryMock.findByEmailWithPassword.mockResolvedValue(null);

    await service.findByEmailWithPassword('USER@Example.COM');

    expect(usersRepositoryMock.findByEmailWithPassword).toHaveBeenCalledWith('user@example.com');
  });

  it('should create user with normalized email', async () => {
    const createdUser = {
      id: 'usr_1',
      fullName: 'Buyer Name',
      email: 'buyer@example.com',
      role: Role.BUYER,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersRepositoryMock.create.mockResolvedValue(createdUser);

    const result = await service.createUser({
      fullName: 'Buyer Name',
      email: 'BUYER@Example.COM',
      passwordHash: 'hashed',
      role: Role.BUYER,
    });

    expect(usersRepositoryMock.create).toHaveBeenCalledWith({
      fullName: 'Buyer Name',
      email: 'buyer@example.com',
      passwordHash: 'hashed',
      role: Role.BUYER,
    });
    expect(result).toEqual(createdUser);
  });
});
