import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../core/config/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RewardCategory, RewardStatus, AdminRole } from '@prisma/client';

describe('RewardAccountController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let adminId: number;
  let rewardAccountId: number;
  let submissionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Clean up database
    await prisma.rewardAccount.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.admin.deleteMany();

    // Create test admin
    const admin = await prisma.admin.create({
      data: {
        username: 'testadmin',
        email: 'admin@test.com',
        passwordHash: 'hashedpassword',
        role: AdminRole.ADMIN,
      },
    });
    adminId = admin.id;

    // Generate auth token
    authToken = jwtService.sign({
      sub: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    // Create test coupon and submission for assignment tests
    const coupon = await prisma.coupon.create({
      data: {
        couponCode: 'TEST123456',
        codeLength: 10,
        createdBy: adminId,
      },
    });

    const submission = await prisma.submission.create({
      data: {
        couponId: coupon.id,
        name: 'Test User',
        email: 'user@test.com',
        phone: '+1234567890',
        address: '123 Test St',
        productExperience: 'Great product',
      },
    });
    submissionId = submission.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.rewardAccount.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.admin.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up reward accounts before each test
    await prisma.rewardAccount.deleteMany();
  });

  describe('POST /api/admin/reward-accounts', () => {
    it('should create a reward account successfully', async () => {
      const createDto = {
        serviceName: 'Netflix Premium',
        accountType: 'Premium Account',
        credentials: 'username:password123',
        subscriptionDuration: '12 months',
        description: 'Premium Netflix account with 4K streaming',
        category: 'STREAMING_SERVICE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceName).toBe(createDto.serviceName);
      expect(response.body.data.accountType).toBe(createDto.accountType);
      expect(response.body.data.category).toBe(createDto.category);
      expect(response.body.data.status).toBe('AVAILABLE');
      expect(response.body.data.createdBy).toBe(adminId);

      rewardAccountId = response.body.data.id;
    });

    it('should require authentication', async () => {
      const createDto = {
        serviceName: 'Netflix Premium',
        accountType: 'Premium Account',
        credentials: 'username:password123',
        category: 'STREAMING_SERVICE',
      };

      await request(app.getHttpServer())
        .post('/api/admin/reward-accounts')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        serviceName: 'Netflix Premium',
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/admin/reward-accounts', () => {
    beforeEach(async () => {
      // Create test reward accounts
      await prisma.rewardAccount.createMany({
        data: [
          {
            serviceName: 'Netflix Premium',
            accountType: 'Premium Account',
            encryptedCredentials: 'encrypted-credentials-1',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
          {
            serviceName: 'Spotify Premium',
            accountType: 'Premium Account',
            encryptedCredentials: 'encrypted-credentials-2',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.ASSIGNED,
            assignedToUserId: submissionId,
            createdBy: adminId,
          },
          {
            serviceName: 'Amazon Gift Card',
            accountType: 'Gift Card',
            encryptedCredentials: 'encrypted-credentials-3',
            category: RewardCategory.GIFT_CARD,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
        ],
      });
    });

    it('should get all reward accounts with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'STREAMING_SERVICE' })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data.every((account: any) => account.category === 'STREAMING_SERVICE')).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'AVAILABLE' })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data.every((account: any) => account.status === 'AVAILABLE')).toBe(true);
    });

    it('should search by service name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Netflix' })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].serviceName).toContain('Netflix');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/reward-accounts')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/admin/reward-accounts/inventory/stats', () => {
    beforeEach(async () => {
      // Create test reward accounts with different statuses
      await prisma.rewardAccount.createMany({
        data: [
          {
            serviceName: 'Netflix 1',
            accountType: 'Premium',
            encryptedCredentials: 'encrypted-1',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
          {
            serviceName: 'Netflix 2',
            accountType: 'Premium',
            encryptedCredentials: 'encrypted-2',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.ASSIGNED,
            assignedToUserId: submissionId,
            createdBy: adminId,
          },
          {
            serviceName: 'Gift Card 1',
            accountType: 'Gift Card',
            encryptedCredentials: 'encrypted-3',
            category: RewardCategory.GIFT_CARD,
            status: RewardStatus.EXPIRED,
            createdBy: adminId,
          },
        ],
      });
    });

    it('should get inventory statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts/inventory/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.available).toBe(1);
      expect(response.body.data.assigned).toBe(1);
      expect(response.body.data.expired).toBe(1);
      expect(response.body.data.deactivated).toBe(0);
      expect(response.body.data.byCategory).toBeDefined();
    });
  });

  describe('GET /api/admin/reward-accounts/available', () => {
    beforeEach(async () => {
      await prisma.rewardAccount.createMany({
        data: [
          {
            serviceName: 'Netflix Premium',
            accountType: 'Premium Account',
            encryptedCredentials: 'encrypted-credentials-1',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
          {
            serviceName: 'Spotify Premium',
            accountType: 'Premium Account',
            encryptedCredentials: 'encrypted-credentials-2',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.ASSIGNED,
            assignedToUserId: submissionId,
            createdBy: adminId,
          },
        ],
      });
    });

    it('should get available reward accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].serviceName).toBe('Netflix Premium');
    });

    it('should filter available accounts by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reward-accounts/available')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'STREAMING_SERVICE' })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/admin/reward-accounts/:id', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should get reward account by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/reward-accounts/${testRewardAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testRewardAccountId);
      expect(response.body.data.serviceName).toBe('Netflix Premium');
    });

    it('should return 404 for non-existent reward account', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/reward-accounts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /api/admin/reward-accounts/:id', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should update reward account', async () => {
      const updateDto = {
        serviceName: 'Netflix Premium Updated',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/admin/reward-accounts/${testRewardAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceName).toBe(updateDto.serviceName);
      expect(response.body.data.description).toBe(updateDto.description);
    });

    it('should return 404 for non-existent reward account', async () => {
      const updateDto = {
        serviceName: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put('/api/admin/reward-accounts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/admin/reward-accounts/assign', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should assign reward to user', async () => {
      const assignDto = {
        rewardAccountId: testRewardAccountId,
        submissionId: submissionId,
        notes: 'Winner of weekly draw',
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ASSIGNED');
      expect(response.body.data.assignedToUserId).toBe(submissionId);
    });

    it('should return 404 for non-existent reward account', async () => {
      const assignDto = {
        rewardAccountId: 99999,
        submissionId: submissionId,
      };

      await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 409 for already assigned reward', async () => {
      // First assignment
      const assignDto = {
        rewardAccountId: testRewardAccountId,
        submissionId: submissionId,
      };

      await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignDto)
        .expect(HttpStatus.OK);

      // Second assignment should fail
      await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('POST /api/admin/reward-accounts/validate-assignment', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should validate assignment eligibility', async () => {
      const validateDto = {
        rewardAccountId: testRewardAccountId,
        submissionId: submissionId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/validate-assignment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validateDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.rewardAccount).toBeDefined();
    });

    it('should return invalid for non-existent reward account', async () => {
      const validateDto = {
        rewardAccountId: 99999,
        submissionId: submissionId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/validate-assignment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validateDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.error).toContain('not found');
    });
  });

  describe('PUT /api/admin/reward-accounts/:id/activate', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.DEACTIVATED,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should activate reward account', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/admin/reward-accounts/${testRewardAccountId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('AVAILABLE');
    });
  });

  describe('PUT /api/admin/reward-accounts/:id/deactivate', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should deactivate reward account', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/admin/reward-accounts/${testRewardAccountId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DEACTIVATED');
    });
  });

  describe('DELETE /api/admin/reward-accounts/:id', () => {
    let testRewardAccountId: number;

    beforeEach(async () => {
      const rewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          encryptedCredentials: 'encrypted-credentials',
          category: RewardCategory.STREAMING_SERVICE,
          status: RewardStatus.AVAILABLE,
          createdBy: adminId,
        },
      });
      testRewardAccountId = rewardAccount.id;
    });

    it('should delete reward account', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/admin/reward-accounts/${testRewardAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedId).toBe(testRewardAccountId);

      // Verify deletion
      const deletedAccount = await prisma.rewardAccount.findUnique({
        where: { id: testRewardAccountId },
      });
      expect(deletedAccount).toBeNull();
    });

    it('should return 404 for non-existent reward account', async () => {
      await request(app.getHttpServer())
        .delete('/api/admin/reward-accounts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/admin/reward-accounts/bulk-create', () => {
    it('should bulk create reward accounts', async () => {
      const bulkCreateDto = {
        rewardAccounts: [
          {
            serviceName: 'Netflix Premium 1',
            accountType: 'Premium Account',
            credentials: 'username1:password123',
            category: 'STREAMING_SERVICE',
          },
          {
            serviceName: 'Netflix Premium 2',
            accountType: 'Premium Account',
            credentials: 'username2:password123',
            category: 'STREAMING_SERVICE',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/bulk-create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkCreateDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(2);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
      expect(response.body.data.successful).toHaveLength(2);
    });
  });

  describe('POST /api/admin/reward-accounts/bulk-operation', () => {
    let testRewardAccountIds: number[];

    beforeEach(async () => {
      const rewardAccounts = await prisma.rewardAccount.createManyAndReturn({
        data: [
          {
            serviceName: 'Netflix 1',
            accountType: 'Premium',
            encryptedCredentials: 'encrypted-1',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
          {
            serviceName: 'Netflix 2',
            accountType: 'Premium',
            encryptedCredentials: 'encrypted-2',
            category: RewardCategory.STREAMING_SERVICE,
            status: RewardStatus.AVAILABLE,
            createdBy: adminId,
          },
        ],
      });
      testRewardAccountIds = rewardAccounts.map(account => account.id);
    });

    it('should perform bulk deactivate operation', async () => {
      const bulkOperationDto = {
        rewardAccountIds: testRewardAccountIds,
        operation: 'deactivate',
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/bulk-operation')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperationDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedCount).toBe(2);
      expect(response.body.data.details).toHaveLength(2);

      // Verify accounts are deactivated
      const updatedAccounts = await prisma.rewardAccount.findMany({
        where: { id: { in: testRewardAccountIds } },
      });
      expect(updatedAccounts.every(account => account.status === RewardStatus.DEACTIVATED)).toBe(true);
    });

    it('should perform bulk activate operation', async () => {
      // First deactivate accounts
      await prisma.rewardAccount.updateMany({
        where: { id: { in: testRewardAccountIds } },
        data: { status: RewardStatus.DEACTIVATED },
      });

      const bulkOperationDto = {
        rewardAccountIds: testRewardAccountIds,
        operation: 'activate',
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/reward-accounts/bulk-operation')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperationDto)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedCount).toBe(2);

      // Verify accounts are activated
      const updatedAccounts = await prisma.rewardAccount.findMany({
        where: { id: { in: testRewardAccountIds } },
      });
      expect(updatedAccounts.every(account => account.status === RewardStatus.AVAILABLE)).toBe(true);
    });
  });
});