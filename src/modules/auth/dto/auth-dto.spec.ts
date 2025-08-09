import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoginDto, RegisterDto, RefreshTokenDto, AdminRole } from './index';

describe('Authentication DTOs', () => {
  describe('LoginDto', () => {
    it('should validate valid login data', async () => {
      const loginData = {
        username: 'admin',
        password: 'password123'
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors).toHaveLength(0);
      expect(loginDto.username).toBe('admin');
      expect(loginDto.password).toBe('password123');
    });

    it('should fail validation with empty username', async () => {
      const loginData = {
        username: '',
        password: 'password123'
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with short password', async () => {
      const loginData = {
        username: 'admin',
        password: '123'
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('RegisterDto', () => {
    it('should validate valid registration data', async () => {
      const registerData = {
        username: 'newadmin',
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        role: AdminRole.ADMIN
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors).toHaveLength(0);
      expect(registerDto.username).toBe('newadmin');
      expect(registerDto.email).toBe('admin@example.com');
      expect(registerDto.role).toBe(AdminRole.ADMIN);
    });

    it('should fail validation with invalid email', async () => {
      const registerData = {
        username: 'newadmin',
        email: 'invalid-email',
        password: 'SecurePassword123!',
        role: AdminRole.ADMIN
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with weak password', async () => {
      const registerData = {
        username: 'newadmin',
        email: 'admin@example.com',
        password: 'weakpass',
        role: AdminRole.ADMIN
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation with invalid username characters', async () => {
      const registerData = {
        username: 'admin@user',
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        role: AdminRole.ADMIN
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should default to ADMIN role when not specified', async () => {
      const registerData = {
        username: 'newadmin',
        email: 'admin@example.com',
        password: 'SecurePassword123!'
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors).toHaveLength(0);
      expect(registerDto.role).toBe(AdminRole.ADMIN);
    });
  });

  describe('RefreshTokenDto', () => {
    it('should validate valid JWT token', async () => {
      const tokenData = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };

      const refreshTokenDto = plainToClass(RefreshTokenDto, tokenData);
      const errors = await validate(refreshTokenDto);

      expect(errors).toHaveLength(0);
      expect(refreshTokenDto.refreshToken).toBe(tokenData.refreshToken);
    });

    it('should fail validation with invalid JWT format', async () => {
      const tokenData = {
        refreshToken: 'invalid-token'
      };

      const refreshTokenDto = plainToClass(RefreshTokenDto, tokenData);
      const errors = await validate(refreshTokenDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isJwt');
    });

    it('should fail validation with empty token', async () => {
      const tokenData = {
        refreshToken: ''
      };

      const refreshTokenDto = plainToClass(RefreshTokenDto, tokenData);
      const errors = await validate(refreshTokenDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});