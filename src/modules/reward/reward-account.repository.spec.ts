import { Test, TestingModule } from '@nestjs/testing';
import { RewardAccountRepository } from './reward-account.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { EncryptionService } from '../../shared/services';
import { RewardCategory, RewardStatus } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RewardAccountRepository', () => {
  let repository: RewardAccountRepository;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockPrismaService = {
    rewardAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    submission: {
      update: jest.fn(),
    },
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardAccountRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    repository = module.get<RewardAccountRepository>(RewardAccountRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find reward account by id', async () => {
      const mockRewardAccount = {
        id: 1,
        serviceName: 'Netflix',
        accountType: 'Premium',
        encryptedCredentials: 'encrypted-data',
        category: RewardCategory.STREAMING_SERVICE,
        status: RewardStatus.AVAILABLE,
        createdBy: 1,
        creator: { id: 1, username: 'admin', email: 'admin@test.com' },
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRewardAccount);
      expect(mockPrismaService.rewardAccount.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          assignedSubmissions: {
            select: {
              id: true,
              name: true,
              email: true,
              submittedAt: true,
            },
          },
        },
      });
    });

    it('should return null if reward account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithCredentials', () => {
    it('should find reward account with decrypted credentials', async () => {
      const mockRewardAccount = {
        id: 1,
        serviceName: 'Netflix',
        encryptedCredentials: 'encrypted-data',
        category: RewardCategory.STREAMING_SERVICE,
        status: RewardStatus.AVAILABLE,
        createdBy: 1,
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);
      mockEncryptionService.decrypt.mockReturnValue('decrypted-credentials');

      const result = await repository.findByIdWithCredentials(1);

      expect(result).toEqual({
        ...mockRewardAccount,
        decryptedCredentials: 'decrypted-credentials',
      });
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data');
    });

    it('should throw error if decryption fails', async () => {
      const mockRewardAccount = {
        id: 1,
        encryptedCredentials: 'invalid-data',
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);
      mockEncryptionService.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(repository.findByIdWithCredentials(1)).rejects.toThrow(
        'Failed to decrypt credentials for reward account 1: Decryption failed'
      );
    });
  });

  describe('create', () => {
    it('should create reward account with encrypted credentials', async () => {
      const createData = {
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'plain-credentials',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: 1,
      };

      const mockCreatedAccount = {
        id: 1,
        ...createData,
        encryptedCredentials: 'encrypted-credentials',
        status: RewardStatus.AVAILABLE,
        creator: { id: 1, username: 'admin', email: 'admin@test.com' },
      };

      mockEncryptionService.encrypt.mockReturnValue('encrypted-credentials');
      mockPrismaService.rewardAccount.create.mockResolvedValue(mockCreatedAccount);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreatedAccount);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('plain-credentials');
      expect(mockPrismaService.rewardAccount.create).toHaveBeenCalledWith({
        data: {
          serviceName: 'Netflix',
          accountType: 'Premium',
          encryptedCredentials: 'encrypted-credentials',
          subscriptionDuration: undefined,
          description: undefined,
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: 1,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw ConflictException on duplicate constraint violation', async () => {
      const createData = {
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'plain-credentials',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: 1,
      };

      mockEncryptionService.encrypt.mockReturnValue('encrypted-credentials');
      mockPrismaService.rewardAccount.create.mockRejectedValue({ code: 'P2002' });

      await expect(repository.create(createData)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update reward account', async () => {
      const updateData = {
        serviceName: 'Updated Netflix',
        status: RewardStatus.ASSIGNED,
      };

      const mockExistingAccount = { id: 1, serviceName: 'Netflix' };
      const mockUpdatedAccount = { id: 1, ...updateData };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockExistingAccount);
      mockPrismaService.rewardAccount.update.mockResolvedValue(mockUpdatedAccount);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(mockUpdatedAccount);
      expect(mockPrismaService.rewardAccount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          assignedSubmissions: {
            select: {
              id: true,
              name: true,
              email: true,
              submittedAt: true,
            },
          },
        },
      });
    });

    it('should encrypt credentials when updating', async () => {
      const updateData = {
        credentials: 'new-plain-credentials',
      };

      const mockExistingAccount = { id: 1, serviceName: 'Netflix' };
      const mockUpdatedAccount = { id: 1, encryptedCredentials: 'new-encrypted-credentials' };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockExistingAccount);
      mockEncryptionService.encrypt.mockReturnValue('new-encrypted-credentials');
      mockPrismaService.rewardAccount.update.mockResolvedValue(mockUpdatedAccount);

      const result = await repository.update(1, updateData);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('new-plain-credentials');
      expect(mockPrismaService.rewardAccount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          encryptedCredentials: 'new-encrypted-credentials',
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if reward account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(repository.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignToUser', () => {
    it('should assign reward account to user', async () => {
      const mockRewardAccount = {
        id: 1,
        status: RewardStatus.AVAILABLE,
        serviceName: 'Netflix',
      };

      const mockUpdatedAccount = {
        ...mockRewardAccount,
        status: RewardStatus.ASSIGNED,
        assignedToUserId: 1,
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);
      mockPrismaService.submission.update.mockResolvedValue({});
      mockPrismaService.rewardAccount.update.mockResolvedValue(mockUpdatedAccount);

      const result = await repository.assignToUser(1, 1, 1);

      expect(mockPrismaService.submission.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          assignedRewardId: 1,
          rewardAssignedAt: expect.any(Date),
          rewardAssignedBy: 1,
        },
      });
      expect(result.status).toBe(RewardStatus.ASSIGNED);
    });

    it('should throw ConflictException if reward account not available', async () => {
      const mockRewardAccount = {
        id: 1,
        status: RewardStatus.ASSIGNED,
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);

      await expect(repository.assignToUser(1, 1, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('getStatistics', () => {
    it('should return reward account statistics', async () => {
      const mockCategoryStats = [
        { category: RewardCategory.STREAMING_SERVICE, _count: { id: 5 } },
        { category: RewardCategory.GIFT_CARD, _count: { id: 3 } },
      ];

      mockPrismaService.rewardAccount.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // available
        .mockResolvedValueOnce(3)  // assigned
        .mockResolvedValueOnce(1)  // expired
        .mockResolvedValueOnce(1); // deactivated

      mockPrismaService.rewardAccount.groupBy.mockResolvedValue(mockCategoryStats);

      const result = await repository.getStatistics();

      expect(result).toEqual({
        total: 10,
        available: 5,
        assigned: 3,
        expired: 1,
        deactivated: 1,
        byCategory: {
          [RewardCategory.STREAMING_SERVICE]: 5,
          [RewardCategory.GIFT_CARD]: 3,
        },
      });
    });
  });
});