import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../../modules/auth/auth.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { LoginDto } from '../../../modules/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../modules/auth/dto/refresh-token.dto';
import { 
  AuthResponseDto, 
  TokenResponseDto, 
  LogoutResponseDto 
} from '../../../modules/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  traceId: string;
}

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate admin user and return JWT tokens with profile information',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Admin login credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Invalid credentials' },
            hint: { type: 'string', example: 'Please check your username and password' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            traceId: { type: 'string', example: 'trace-123' },
            version: { type: 'string', example: '1.0.0' },
          },
        },
        links: {
          type: 'object',
          properties: {
            self: { type: 'string', example: '/api/auth/login' },
            documentation: { type: 'string', example: '/api/docs' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'username' },
                  message: { type: 'string', example: 'Username is required' },
                  value: { type: 'string', example: '' },
                  constraint: { type: 'string', example: 'isNotEmpty' },
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AuthResponseDto>> {
    try {
      const authResponse = await this.authService.login(
        loginDto.username,
        loginDto.password,
      );

      // Map to DTO format
      const responseDto: AuthResponseDto = {
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        admin: {
          id: authResponse.admin.id,
          username: authResponse.admin.username,
          email: authResponse.admin.email,
          role: authResponse.admin.role,
          lastLogin: authResponse.admin.lastLogin || undefined,
        },
        expiresIn: authResponse.expiresIn,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/auth`,
        action: 'login',
      });

      return this.responseBuilder.buildSuccessResponse(
        responseDto,
        'Login successful',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const links = this.responseBuilder.generateHATEOASLinks({
          baseUrl: `${req.protocol}://${req.get('host')}/api/auth/login`,
        });

        throw new UnauthorizedException(
          this.responseBuilder.buildErrorResponse(
            'UNAUTHORIZED',
            error.message,
            HttpStatus.UNAUTHORIZED,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/auth/login`,
            undefined,
            'Please check your username and password',
          ),
        );
      }
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using a valid refresh token',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token for generating new access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REFRESH_TOKEN' },
            message: { type: 'string', example: 'Invalid or expired refresh token' },
            hint: { type: 'string', example: 'Please login again to get a new refresh token' },
          },
        },
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<TokenResponseDto>> {
    try {
      const tokens = await this.authService.refreshAccessToken(
        refreshTokenDto.refreshToken,
      );

      const tokenResponse: TokenResponseDto = {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/auth`,
        action: 'refresh',
      });

      return this.responseBuilder.buildSuccessResponse(
        tokenResponse,
        'Token refreshed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(
          this.responseBuilder.buildErrorResponse(
            'INVALID_REFRESH_TOKEN',
            error.message,
            HttpStatus.UNAUTHORIZED,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/auth/refresh`,
            undefined,
            'Please login again to get a new refresh token',
          ),
        );
      }
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin logout',
    description: 'Logout the authenticated admin user and invalidate session',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Authentication required' },
          },
        },
      },
    },
  })
  async logout(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<LogoutResponseDto>> {
    try {
      await this.authService.logout(req.user.id);

      const logoutResponse: LogoutResponseDto = {
        message: 'Successfully logged out',
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/auth`,
        action: 'logout',
      });

      return this.responseBuilder.buildSuccessResponse(
        logoutResponse,
        'Logout successful',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'LOGOUT_ERROR',
          'Failed to logout',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/auth/logout`,
          error.message,
        ),
      );
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Get the authenticated admin user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const admin = await this.authService.validateAdminById(req.user.id);
      
      if (!admin) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      const adminProfile = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/auth`,
        resourceId: admin.id,
        action: 'profile',
      });

      return this.responseBuilder.buildSuccessResponse(
        adminProfile,
        'Profile retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'PROFILE_ERROR',
          'Failed to retrieve profile',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/auth/profile`,
          error.message,
        ),
      );
    }
  }
}