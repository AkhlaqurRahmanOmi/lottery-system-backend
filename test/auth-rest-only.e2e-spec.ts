import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthRestModule } from '../src/api/rest/auth/auth.module';
import { PrismaService } from '../src/core/config/prisma/prisma.service';
import { PrismaModule } from '../src/core/config/prisma/prisma.module';
import * as bcrypt from 'bcrypt';

describe('AuthController REST Only (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthRestModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Clean up and create test admin
    await prisma.admin.deleteMany();
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.admin.create({
      data: {
        username: 'testadmin',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.admin.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data).toHaveProperty('admin');
          expect(res.body.data.admin.username).toBe('testadmin');
          expect(res.body.data.admin.email).toBe('test@example.com');
          expect(res.body.data).toHaveProperty('expiresIn');
          expect(res.body.message).toBe('Login successful');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get a valid refresh token first
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token successfully with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('expiresIn');
          expect(res.body.message).toBe('Token refreshed successfully');
        });
    });
  });

  describe('/api/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Get a valid access token first
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123',
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBe('Successfully logged out');
          expect(res.body.message).toBe('Logout successful');
        });
    });
  });

  describe('/api/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Get a valid access token first
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123',
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get profile successfully with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.username).toBe('testadmin');
          expect(res.body.data.email).toBe('test@example.com');
          expect(res.body.data.role).toBe('ADMIN');
          expect(res.body.message).toBe('Profile retrieved successfully');
        });
    });
  });
});