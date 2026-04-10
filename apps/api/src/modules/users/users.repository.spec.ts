import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    jest.clearAllMocks();
  });

  it('should return safe user entity by email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'usr_1',
      fullName: 'Buyer Name',
      email: 'buyer@example.com',
      role: Role.BUYER,
      isVerified: false,
      isActive: true,
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
      updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    });

    const result = await repository.findByEmail('buyer@example.com');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result?.email).toBe('buyer@example.com');
    expect(result?.fullName).toBe('Buyer Name');
  });

  it('should create user with fullName and return safe entity', async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 'usr_1',
      fullName: 'Buyer Name',
      email: 'buyer@example.com',
      role: Role.BUYER,
      isVerified: false,
      isActive: true,
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
      updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    });

    const result = await repository.create({
      fullName: 'Buyer Name',
      email: 'buyer@example.com',
      passwordHash: 'hashed-password',
      role: Role.BUYER,
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        fullName: 'Buyer Name',
        email: 'buyer@example.com',
        passwordHash: 'hashed-password',
        role: Role.BUYER,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result.fullName).toBe('Buyer Name');
  });
});
