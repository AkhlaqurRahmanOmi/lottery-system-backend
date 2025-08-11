import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../core/config/prisma/prisma.service';
import { AuthService } from '../../../modules/auth/auth.service';
import { AdminRole, CouponStatus } from '@prisma/client';

describe('SubmissionController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let testAdminId: number;
  let testCouponId: number;
  let testSubmissionId: number;
  let testRewardAccountId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();

    // Clean up any existing test data
    await cleanupTestData();

    // Create test admin
    const testAdmin = await prisma.admin.create({
      data: {
        username: 'testadmin',
        email: 'testadmin@example.com',
        passwordHash: await authService.hashPassword('password123'),
        role: AdminRole.ADMIN,
        isActive: true,
      },
    });
    testAdminId = testAdmin.id;

    // Get admin token
    const authResponse = await authService.login('testadmin', 'password123');
    adminToken = authResponse.accessToken;

    // Create test coupon
    const testCoupon = await prisma.coupon.create({
      data: {
        couponCode: 'TEST123456',
        codeLength: 10,
        status: CouponStatus.ACTIVE,
        createdBy: testAdminId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    testCouponId = testCoupon.id;

    // Create test reward account
    const testRewardAccount = await prisma.rewardAccount.create({
      data: {
        serviceName: 'Test Streaming Service',
        accountType: 'Premium',
        encryptedCredentials: 'encrypted-test-credentials',
        category: 'STREAMING_SERVICE',
        status: 'AVAILABLE',
        createdBy: testAdminId,
      },
    });
    testRewardAccountId = testRewardAccount.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    // Delete in correct order due to foreign key constraints
    await prisma.submission.deleteMany({
      where: {
        OR: [
          { coupon: { couponCode: { startsWith: 'TEST' } } },
          { email: { contains: 'test' } },
        ],
      },
    });
    await prisma.coupon.deleteMany({
      where: { couponCode: { startsWith: 'TEST' } },
    });
    await prisma.rewardAccount.deleteMany({
      where: { serviceName: { contains: 'Test' } },
    });
    await prisma.admin.deleteMany({
      where: { username: { startsWith: 'test' } },
    });
  }

  describe('POST /api/submissions/validate-coupon', () => {
    it('should validate a valid coupon', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/submissions/validate-coupon')
        .send({
          couponCode: 'TEST123456',
        })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.couponCode).toBe('TEST123456');
      expect(response.body.message).toContain('valid');
    });

    it('should handle invalid coupon', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/submissions/validate-coupon')
        .send({
          couponCode: 'INVALID123',
        })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.couponCode).toBe('INVALID123');
    });

    it('should validate coupon code format', async () => {
      await request(app.getHttpServer())
        .post('/api/submissions/validate-coupon')
        .send({
          couponCode: 'invalid',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/submissions', () => {
    it('should create a submission successfully', async () => {
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, Anytown, ST 12345, Country',
        productExperience: 'I have been using this product for 2 years and find it very helpful.',
        selectedRewardId: testRewardAccountId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/submissions')
        .send(submissionData)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.couponCode).toBe('TEST123456');
      expect(response.body.message).toContain('successfully');

      testSubmissionId = response.body.data.id;

      // Verify coupon is now redeemed
      const coupon = await prisma.coupon.findUnique({
        where: { id: testCouponId },
      });
      expect(coupon?.status).toBe(CouponStatus.REDEEMED);
    });

    it('should prevent duplicate coupon redemption', async () => {
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1234567891',
        address: '456 Oak St, Anytown, ST 12345, Country',
        productExperience: 'Great product experience.',
        selectedRewardId: testRewardAccountId,
      };

      await request(app.getHttpServer())
        .post('/api/submissions')
        .send(submissionData)
        .expect(HttpStatus.CONFLICT);
    });

    it('should validate required fields', async () => {
      const invalidSubmissionData = {
        couponCode: 'TEST123456',
        name: '',
        email: 'invalid-email',
        phone: 'invalid-phone',
        address: '',
        productExperience: '',
        selectedRewardId: testRewardAccountId,
      };

      await request(app.getHttpServer())
        .post('/api/submissions')
        .send(invalidSubmissionData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/submissions (Admin)', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should get submissions with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions?search=john')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/submissions/:id (Admin)', () => {
    it('should get submission by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/submissions/${testSubmissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSubmissionId);
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john.doe@example.com');
    });

    it('should handle non-existent submission', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/submissions/${testSubmissionId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/submissions/statistics (Admin)', () => {
    it('should get submission statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.withAssignedRewards).toBeDefined();
      expect(response.body.data.withoutAssignedRewards).toBeDefined();
      expect(response.body.data.rewardAssignmentRate).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions/statistics')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/submissions/without-rewards (Admin)', () => {
    it('should get submissions without rewards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions/without-rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions/without-rewards')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/submissions/assign-reward (Admin)', () => {
    it('should assign reward to submission', async () => {
      const assignmentData = {
        submissionId: testSubmissionId,
        rewardAccountId: testRewardAccountId,
        notes: 'Test reward assignment',
      };

      const response = await request(app.getHttpServer())
        .post('/api/submissions/assign-reward')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedRewardId).toBe(testRewardAccountId);
      expect(response.body.data.rewardAssignedBy).toBe(testAdminId);
      expect(response.body.data.rewardAssignedAt).toBeDefined();

      // Verify reward account is now assigned
      const rewardAccount = await prisma.rewardAccount.findUnique({
        where: { id: testRewardAccountId },
      });
      expect(rewardAccount?.status).toBe('ASSIGNED');
    });

    it('should prevent assigning already assigned reward', async () => {
      const assignmentData = {
        submissionId: testSubmissionId,
        rewardAccountId: testRewardAccountId,
        notes: 'Duplicate assignment attempt',
      };

      await request(app.getHttpServer())
        .post('/api/submissions/assign-reward')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require authentication', async () => {
      const assignmentData = {
        submissionId: testSubmissionId,
        rewardAccountId: testRewardAccountId,
      };

      await request(app.getHttpServer())
        .post('/api/submissions/assign-reward')
        .send(assignmentData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/submissions/bulk-assign-rewards (Admin)', () => {
    let additionalCouponId: number;
    let additionalSubmissionId: number;
    let additionalRewardAccountId: number;

    beforeAll(async () => {
      // Create additional test data for bulk assignment
      const additionalCoupon = await prisma.coupon.create({
        data: {
          couponCode: 'TEST789012',
          codeLength: 10,
          status: CouponStatus.ACTIVE,
          createdBy: testAdminId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      additionalCouponId = additionalCoupon.id;

      const additionalRewardAccount = await prisma.rewardAccount.create({
        data: {
          serviceName: 'Test Gaming Service',
          accountType: 'Premium',
          encryptedCredentials: 'encrypted-test-credentials-2',
          category: 'DIGITAL_PRODUCT',
          status: 'AVAILABLE',
          createdBy: testAdminId,
        },
      });
      additionalRewardAccountId = additionalRewardAccount.id;

      // Create additional submission
      const submissionData = {
        couponCode: 'TEST789012',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567892',
        address: '789 Pine St, Anytown, ST 12345, Country',
        productExperience: 'Excellent product experience.',
        selectedRewardId: additionalRewardAccountId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/submissions')
        .send(submissionData);

      additionalSubmissionId = response.body.data.id;
    });

    it('should handle bulk reward assignment', async () => {
      // First remove existing assignment to test bulk assignment
      await request(app.getHttpServer())
        .delete(`/api/submissions/${testSubmissionId}/reward`)
        .set('Authorization', `Bearer ${adminToken}`);

      const bulkAssignmentData = {
        submissionIds: [testSubmissionId, additionalSubmissionId],
        rewardAccountIds: [testRewardAccountId, additionalRewardAccountId],
        notes: 'Bulk test assignment',
      };

      const response = await request(app.getHttpServer())
        .post('/api/submissions/bulk-assign-rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkAssignmentData)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.failureCount).toBe(0);
      expect(response.body.data.results).toHaveLength(2);
    });

    it('should validate array lengths', async () => {
      const invalidBulkAssignmentData = {
        submissionIds: [testSubmissionId],
        rewardAccountIds: [testRewardAccountId, additionalRewardAccountId],
        notes: 'Invalid bulk assignment',
      };

      await request(app.getHttpServer())
        .post('/api/submissions/bulk-assign-rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBulkAssignmentData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /api/submissions/:id/reward (Admin)', () => {
    it('should remove reward assignment', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/submissions/${testSubmissionId}/reward`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedRewardId).toBeNull();
      expect(response.body.data.rewardAssignedAt).toBeNull();
      expect(response.body.data.rewardAssignedBy).toBeNull();

      // Verify reward account is now available again
      const rewardAccount = await prisma.rewardAccount.findUnique({
        where: { id: testRewardAccountId },
      });
      expect(rewardAccount?.status).toBe('AVAILABLE');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/submissions/${testSubmissionId}/reward`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/submissions/search/email (Admin)', () => {
    it('should search submissions by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions/search/email?email=john.doe@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toBe('john.doe@example.com');
    });

    it('should handle empty search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/submissions/search/email?email=nonexistent@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it('should require email parameter', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions/search/email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/submissions/search/email?email=test@example.com')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /api/submissions/:id (Admin)', () => {
    it('should delete submission', async () => {
      await request(app.getHttpServer())
        .delete(`/api/submissions/${testSubmissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify submission is deleted
      const submission = await prisma.submission.findUnique({
        where: { id: testSubmissionId },
      });
      expect(submission).toBeNull();
    });

    it('should handle non-existent submission', async () => {
      await request(app.getHttpServer())
        .delete('/api/submissions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/submissions/${testSubmissionId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});