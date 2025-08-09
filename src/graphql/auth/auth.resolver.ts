import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import {
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  TokenResponseDto,
  LogoutResponseDto,
  AdminProfileDto,
} from '../../modules/auth/dto';
import type { Admin } from '@prisma/client';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(private readonly authService: AuthService) {}

  @Query(() => AdminProfileDto, {
    description: 'Get current authenticated admin profile',
  })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentAdmin() admin: Admin): Promise<AdminProfileDto> {
    try {
      if (!admin || !admin.id) {
        this.logger.warn('Invalid admin session in me query');
        throw new UnauthorizedException('Invalid admin session');
      }

      this.logger.log(`Admin profile requested for user: ${admin.username}`);

      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin ?? undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get admin profile: ${error.message}`, error.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Failed to get admin profile');
    }
  }

  @Mutation(() => AuthResponseDto, {
    description: 'Authenticate admin user and return access tokens with profile information',
  })
  async login(
    @Args('loginInput') loginInput: LoginDto,
  ): Promise<AuthResponseDto> {
    try {
      const { username, password } = loginInput;
      
      if (!username || !password) {
        this.logger.warn(`Login attempt with missing credentials for username: ${username || 'undefined'}`);
        throw new BadRequestException('Username and password are required');
      }

      this.logger.log(`Login attempt for username: ${username}`);
      const authResponse = await this.authService.login(username, password);

      // Log successful login for audit purposes
      this.logger.log(`Admin ${username} logged in successfully via GraphQL`);

      // Transform the response to match DTO types (null -> undefined)
      return {
        ...authResponse,
        admin: {
          ...authResponse.admin,
          lastLogin: authResponse.admin.lastLogin ?? undefined,
        },
      };
    } catch (error) {
      // Log failed login attempt for security monitoring
      this.logger.warn(`Failed GraphQL login attempt for username: ${loginInput.username}`, {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Don't expose internal errors to prevent information leakage
      this.logger.error(`Unexpected error during GraphQL login: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @Mutation(() => TokenResponseDto, {
    description: 'Refresh access token using refresh token',
  })
  async refreshToken(
    @Args('refreshTokenInput') refreshTokenInput: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    try {
      const { refreshToken } = refreshTokenInput;
      
      if (!refreshToken) {
        this.logger.warn('Token refresh attempt with missing refresh token');
        throw new BadRequestException('Refresh token is required');
      }

      this.logger.log('Token refresh attempt via GraphQL');
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      this.logger.log('Token refreshed successfully via GraphQL');
      return {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      this.logger.warn(`Failed GraphQL token refresh attempt: ${error.message}`, {
        timestamp: new Date().toISOString(),
      });
      
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Unexpected error during GraphQL token refresh: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  @Mutation(() => LogoutResponseDto, {
    description: 'Logout admin user and invalidate session',
  })
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentAdmin() admin: Admin,
  ): Promise<LogoutResponseDto> {
    try {
      if (!admin || !admin.id) {
        this.logger.warn('Logout attempt with invalid admin session');
        throw new UnauthorizedException('Invalid admin session');
      }

      this.logger.log(`Logout attempt for admin: ${admin.username}`);
      await this.authService.logout(admin.id);

      this.logger.log(`Admin ${admin.username} logged out successfully via GraphQL`);

      return {
        message: 'Successfully logged out',
      };
    } catch (error) {
      this.logger.error(`Failed to logout admin: ${error.message}`, error.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Logout failed');
    }
  }
}