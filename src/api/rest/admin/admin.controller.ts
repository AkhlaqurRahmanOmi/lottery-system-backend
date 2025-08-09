import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseIntPipe,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from '../../../modules/admin/admin.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';
import { AdminRole } from '@prisma/client';

// Import DTOs
import { CreateAdminRestDto } from './dto/create-admin-rest.dto';
import { UpdateAdminRestDto } from './dto/update-admin-rest.dto';
import { AdminQueryRestDto } from './dto/admin-query-rest.dto';
import { AdminProfileUpdateRestDto } from './dto/admin-profile-rest.dto';
import { 
  PasswordResetRequestRestDto, 
  PasswordResetConfirmRestDto, 
  ChangePasswordRestDto 
} from './dto/password-reset-rest.dto';

// Import response DTOs
import { 
  AdminResponseDto, 
  PaginatedAdminResponseDto 
} from '../../../modules/admin/dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: AdminRole;
  };
  traceId: string;
}

@ApiTags('Admin Management')
@Controller('api/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new admin',
    description: 'Create a new admin account. Only SUPER_ADMIN can create other admins.',
  })
  @ApiBody({
    type: CreateAdminRestDto,
    description: 'Admin creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin created successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Only SUPER_ADMIN can create admins',
  })
  @ApiConflictResponse({
    description: 'Username or email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async create(
    @Body() createAdminDto: CreateAdminRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      // Check if user has permission to create admins
      if (req.user.role !== AdminRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can create admin accounts');
      }

      const admin = await this.adminService.create(createAdminDto, req.user.id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        resourceId: admin.id,
        action: 'create',
      });

      return this.responseBuilder.buildSuccessResponse(
        admin,
        'Admin created successfully',
        HttpStatus.CREATED,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin`,
            undefined,
            'Please use a different username or email address',
          ),
        );
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          this.responseBuilder.buildErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            error.message,
            HttpStatus.FORBIDDEN,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin`,
            undefined,
            'Contact a SUPER_ADMIN to create admin accounts',
          ),
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all admins',
    description: 'Retrieve a paginated list of admin accounts with filtering and sorting options.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for username or email',
    example: 'admin',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: AdminRole,
    description: 'Filter by admin role',
    example: AdminRole.ADMIN,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admins retrieved successfully',
    type: PaginatedAdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async findAll(
    @Query() queryDto: AdminQueryRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<PaginatedAdminResponseDto>> {
    try {
      const result = await this.adminService.findAll(queryDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        currentPage: result.page,
        totalPages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
        queryParams: queryDto,
        action: 'list',
      });

      // Build pagination meta for response builder
      const paginationMeta = {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
      };

      return this.responseBuilder.buildSuccessResponse(
        result,
        'Admins retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
        paginationMeta,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'QUERY_ERROR',
          'Failed to retrieve admins',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin`,
          error.message,
        ),
      );
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get admin statistics',
    description: 'Retrieve statistics about admin accounts (total, active, inactive, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 10 },
        active: { type: 'number', example: 8 },
        inactive: { type: 'number', example: 2 },
        superAdmins: { type: 'number', example: 2 },
        regularAdmins: { type: 'number', example: 6 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const statistics = await this.adminService.getStatistics();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/statistics`,
        action: 'statistics',
      });

      return this.responseBuilder.buildSuccessResponse(
        statistics,
        'Statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'STATISTICS_ERROR',
          'Failed to retrieve statistics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/statistics`,
          error.message,
        ),
      );
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search admins',
    description: 'Search admin accounts by username or email',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
    example: 'admin',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: [AdminResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Search query is required',
  })
  async search(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto[]>> {
    try {
      if (!query || query.trim().length === 0) {
        throw new BadRequestException('Search query is required');
      }

      const results = await this.adminService.search(query.trim(), limit);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/search`,
        queryParams: { q: query, limit },
        action: 'search',
      });

      return this.responseBuilder.buildSuccessResponse(
        results,
        `Found ${results.length} admin(s) matching "${query}"`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SEARCH_ERROR',
          'Failed to search admins',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/search`,
          error.message,
        ),
      );
    }
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get own profile',
    description: 'Get the authenticated admin\'s profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      const profile = await this.adminService.getProfile(req.user.id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/profile`,
        resourceId: req.user.id,
        action: 'profile',
      });

      return this.responseBuilder.buildSuccessResponse(
        profile,
        'Profile retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'PROFILE_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/profile`,
          ),
        );
      }
      throw error;
    }
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update own profile',
    description: 'Update the authenticated admin\'s profile information',
  })
  @ApiBody({
    type: AdminProfileUpdateRestDto,
    description: 'Profile update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or incorrect current password',
  })
  async updateProfile(
    @Body() updateProfileDto: AdminProfileUpdateRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      const updatedProfile = await this.adminService.updateProfile(
        req.user.id,
        updateProfileDto,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/profile`,
        resourceId: req.user.id,
        action: 'update-profile',
      });

      return this.responseBuilder.buildSuccessResponse(
        updatedProfile,
        'Profile updated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'PROFILE_UPDATE_ERROR',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/profile`,
            undefined,
            'Please check your current password and try again',
          ),
        );
      }
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get admin by ID',
    description: 'Retrieve a specific admin account by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Admin ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin retrieved successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Admin not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      const admin = await this.adminService.findByIdOrThrow(id);
      const adminResponse = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        lastLogin: admin.lastLogin,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        resourceId: id,
        action: 'get',
      });

      return this.responseBuilder.buildSuccessResponse(
        adminResponse,
        'Admin retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update admin',
    description: 'Update an admin account. Only SUPER_ADMIN can update other admins.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Admin ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateAdminRestDto,
    description: 'Admin update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin updated successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Only SUPER_ADMIN can update other admins',
  })
  @ApiNotFoundResponse({
    description: 'Admin not found',
  })
  @ApiConflictResponse({
    description: 'Username or email already exists',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      // Check if user has permission to update admins
      if (req.user.role !== AdminRole.SUPER_ADMIN && req.user.id !== id) {
        throw new ForbiddenException('Only SUPER_ADMIN can update other admin accounts');
      }

      const admin = await this.adminService.update(id, updateAdminDto, req.user.id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        resourceId: id,
        action: 'update',
      });

      return this.responseBuilder.buildSuccessResponse(
        admin,
        'Admin updated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
          ),
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
            undefined,
            'Please use a different username or email address',
          ),
        );
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          this.responseBuilder.buildErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            error.message,
            HttpStatus.FORBIDDEN,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
            undefined,
            'Contact a SUPER_ADMIN to update admin accounts',
          ),
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete admin',
    description: 'Permanently delete an admin account. Only SUPER_ADMIN can delete admins. Cannot delete admins who have created coupons.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Admin ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Admin deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Only SUPER_ADMIN can delete admins',
  })
  @ApiNotFoundResponse({
    description: 'Admin not found',
  })
  @ApiConflictResponse({
    description: 'Cannot delete admin who has created coupons',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      // Check if user has permission to delete admins
      if (req.user.role !== AdminRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can delete admin accounts');
      }

      // Prevent self-deletion
      if (req.user.id === id) {
        throw new BadRequestException('Cannot delete your own account');
      }

      await this.adminService.delete(id, req.user.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
          ),
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_DELETE_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
            undefined,
            'Consider deactivating the admin instead',
          ),
        );
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          this.responseBuilder.buildErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            error.message,
            HttpStatus.FORBIDDEN,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
            undefined,
            'Contact a SUPER_ADMIN to delete admin accounts',
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'INVALID_OPERATION',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate admin',
    description: 'Deactivate an admin account (soft delete). Only SUPER_ADMIN can deactivate admins.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Admin ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin deactivated successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Only SUPER_ADMIN can deactivate admins',
  })
  @ApiNotFoundResponse({
    description: 'Admin not found',
  })
  @ApiBadRequestResponse({
    description: 'Admin is already inactive',
  })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      // Check if user has permission to deactivate admins
      if (req.user.role !== AdminRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can deactivate admin accounts');
      }

      // Prevent self-deactivation
      if (req.user.id === id) {
        throw new BadRequestException('Cannot deactivate your own account');
      }

      const admin = await this.adminService.softDelete(id, req.user.id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        resourceId: id,
        action: 'deactivate',
      });

      return this.responseBuilder.buildSuccessResponse(
        admin,
        'Admin deactivated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/deactivate`,
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'INVALID_OPERATION',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/deactivate`,
          ),
        );
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          this.responseBuilder.buildErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            error.message,
            HttpStatus.FORBIDDEN,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/deactivate`,
            undefined,
            'Contact a SUPER_ADMIN to deactivate admin accounts',
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivate admin',
    description: 'Reactivate a deactivated admin account. Only SUPER_ADMIN can reactivate admins.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Admin ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin reactivated successfully',
    type: AdminResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Only SUPER_ADMIN can reactivate admins',
  })
  @ApiNotFoundResponse({
    description: 'Admin not found',
  })
  @ApiBadRequestResponse({
    description: 'Admin is already active',
  })
  async reactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AdminResponseDto>> {
    try {
      // Check if user has permission to reactivate admins
      if (req.user.role !== AdminRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can reactivate admin accounts');
      }

      const admin = await this.adminService.reactivate(id, req.user.id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin`,
        resourceId: id,
        action: 'reactivate',
      });

      return this.responseBuilder.buildSuccessResponse(
        admin,
        'Admin reactivated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/reactivate`,
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'INVALID_OPERATION',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/reactivate`,
          ),
        );
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(
          this.responseBuilder.buildErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            error.message,
            HttpStatus.FORBIDDEN,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/${id}/reactivate`,
            undefined,
            'Contact a SUPER_ADMIN to reactivate admin accounts',
          ),
        );
      }
      throw error;
    }
  }

  @Post('password/reset-request')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Request a password reset token for an admin account',
  })
  @ApiBody({
    type: PasswordResetRequestRestDto,
    description: 'Password reset request data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset token generated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset token sent to email' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Admin not found or inactive',
  })
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() resetRequestDto: PasswordResetRequestRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ message: string; token?: string }>> {
    try {
      const token = await this.adminService.generatePasswordResetToken(resetRequestDto.email);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/password`,
        action: 'reset-request',
      });

      // In development, return the token for testing purposes
      // In production, this should only send email and return success message
      const responseData = process.env.NODE_ENV === 'development' 
        ? { message: 'Password reset token generated successfully', token }
        : { message: 'Password reset token sent to email' };

      return this.responseBuilder.buildSuccessResponse(
        responseData,
        'Password reset request processed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ADMIN_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/password/reset-request`,
          ),
        );
      }
      throw error;
    }
  }

  @Post('password/reset-confirm')
  @ApiOperation({
    summary: 'Confirm password reset',
    description: 'Reset password using a valid reset token',
  })
  @ApiBody({
    type: PasswordResetConfirmRestDto,
    description: 'Password reset confirmation data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token',
  })
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(
    @Body() resetConfirmDto: PasswordResetConfirmRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ message: string }>> {
    try {
      await this.adminService.resetPasswordWithToken(
        resetConfirmDto.token,
        resetConfirmDto.newPassword,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/password`,
        action: 'reset-confirm',
      });

      return this.responseBuilder.buildSuccessResponse(
        { message: 'Password reset successfully' },
        'Password reset completed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'INVALID_RESET_TOKEN',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/password/reset-confirm`,
            undefined,
            'Please request a new password reset token',
          ),
        );
      }
      throw error;
    }
  }

  @Put('password/change')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the authenticated admin\'s password',
  })
  @ApiBody({
    type: ChangePasswordRestDto,
    description: 'Password change data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Current password is incorrect',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ message: string }>> {
    try {
      await this.adminService.changePassword(
        req.user.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/password`,
        action: 'change',
      });

      return this.responseBuilder.buildSuccessResponse(
        { message: 'Password changed successfully' },
        'Password changed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'PASSWORD_CHANGE_ERROR',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/password/change`,
            undefined,
            'Please check your current password and try again',
          ),
        );
      }
      throw error;
    }
  }
}