import { 
  Resolver, 
  Query, 
  Mutation, 
  Args, 
  Int,
  Subscription 
} from '@nestjs/graphql';
import { 
  UseGuards, 
  Logger, 
  ForbiddenException, 
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { AdminService } from '../../modules/admin/admin.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  AdminResponseDto,
  PaginatedAdminResponseDto
} from '../../modules/admin/dto/admin-response.dto';
import {
  CreateAdminGraphQLDto,
  UpdateAdminGraphQLDto,
  AdminQueryGraphQLDto,
  AdminProfileUpdateGraphQLDto,
  PasswordResetGraphQLDto,
  ChangePasswordGraphQLDto,
  AdminStatisticsGraphQLDto
} from './dto';

@Resolver(() => AdminResponseDto)
export class AdminResolver {
  private readonly logger = new Logger(AdminResolver.name);

  constructor(private readonly adminService: AdminService) {}

  // ==================== QUERIES ====================

  @Query(() => AdminResponseDto, {
    description: 'Get admin by ID (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async admin(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested admin with ID: ${id}`);
      
      const admin = await this.adminService.findByIdOrThrow(id);
      
      this.logger.log(`Successfully retrieved admin: ${admin.username}`);
      
      // Convert Admin entity to AdminResponseDto (exclude password hash)
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        lastLogin: admin.lastLogin,
      };
    } catch (error) {
      this.logger.error(`Failed to get admin by ID ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to retrieve admin');
    }
  }

  @Query(() => PaginatedAdminResponseDto, {
    description: 'Get all admins with filtering and pagination (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async admins(
    @Args('query', { nullable: true }) query?: AdminQueryGraphQLDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<PaginatedAdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested admin list with query:`, query);
      
      const result = await this.adminService.findAll(query || {});
      
      this.logger.log(`Successfully retrieved ${result.data.length} admins (total: ${result.total})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get admin list: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve admin list');
    }
  }

  @Query(() => [AdminResponseDto], {
    description: 'Search admins by username or email (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async searchAdmins(
    @Args('searchTerm') searchTerm: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto[]> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} searching admins with term: ${searchTerm}`);
      
      const admins = await this.adminService.search(searchTerm, limit);
      
      this.logger.log(`Found ${admins.length} admins matching search term: ${searchTerm}`);
      return admins;
    } catch (error) {
      this.logger.error(`Failed to search admins: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to search admins');
    }
  }

  @Query(() => AdminStatisticsGraphQLDto, {
    description: 'Get admin statistics (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async adminStatistics(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminStatisticsGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested admin statistics`);
      
      const stats = await this.adminService.getStatistics();
      
      this.logger.log(`Successfully retrieved admin statistics`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get admin statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve admin statistics');
    }
  }

  @Query(() => AdminResponseDto, {
    description: 'Get current admin profile (self-service)'
  })
  @UseGuards(JwtAuthGuard)
  async myProfile(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested their profile`);
      
      const profile = await this.adminService.getProfile(currentAdmin.id);
      
      this.logger.log(`Successfully retrieved profile for admin: ${currentAdmin.username}`);
      return profile;
    } catch (error) {
      this.logger.error(`Failed to get admin profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve profile');
    }
  }

  // ==================== MUTATIONS ====================

  @Mutation(() => AdminResponseDto, {
    description: 'Create new admin account (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async createAdmin(
    @Args('input') input: CreateAdminGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} creating new admin: ${input.username}`);
      
      // Check for existing username or email
      const [existingByUsername, existingByEmail] = await Promise.all([
        this.adminService.findByUsername(input.username),
        this.adminService.findByEmail(input.email)
      ]);

      if (existingByUsername) {
        throw new ConflictException('Username already exists');
      }

      if (existingByEmail) {
        throw new ConflictException('Email already exists');
      }

      const admin = await this.adminService.create(input, currentAdmin.id);
      
      this.logger.log(`Successfully created admin: ${admin.username} by ${currentAdmin.username}`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to create admin: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to create admin');
    }
  }

  @Mutation(() => AdminResponseDto, {
    description: 'Update admin account (requires SUPER_ADMIN role or self-update for basic fields)'
  })
  @UseGuards(JwtAuthGuard)
  async updateAdmin(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateAdminGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} updating admin ID: ${id}`);
      
      // Check permissions
      const isSelfUpdate = currentAdmin.id === id;
      const isSuperAdmin = currentAdmin.role === AdminRole.SUPER_ADMIN;
      
      if (!isSelfUpdate && !isSuperAdmin) {
        throw new ForbiddenException('You can only update your own profile or you must be a super admin');
      }

      // Restrict role changes to super admins only
      if (input.role && !isSuperAdmin) {
        throw new ForbiddenException('Only super admins can change roles');
      }

      // Restrict isActive changes to super admins only (and not self-deactivation)
      if (input.isActive !== undefined && (!isSuperAdmin || isSelfUpdate)) {
        throw new ForbiddenException('Only super admins can change active status of other admins');
      }

      // Check for username/email conflicts if updating
      if (input.username || input.email) {
        const [existingByUsername, existingByEmail] = await Promise.all([
          input.username ? this.adminService.findByUsername(input.username) : null,
          input.email ? this.adminService.findByEmail(input.email) : null
        ]);

        if (existingByUsername && existingByUsername.id !== id) {
          throw new ConflictException('Username already exists');
        }

        if (existingByEmail && existingByEmail.id !== id) {
          throw new ConflictException('Email already exists');
        }
      }

      const admin = await this.adminService.update(id, input, currentAdmin.id);
      
      this.logger.log(`Successfully updated admin: ${admin.username} by ${currentAdmin.username}`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to update admin: ${error.message}`, error.stack);
      
      if (error instanceof ForbiddenException || error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update admin');
    }
  }

  @Mutation(() => AdminResponseDto, {
    description: 'Update current admin profile (self-service)'
  })
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Args('input') input: AdminProfileUpdateGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} updating their profile`);
      
      // Check for username/email conflicts if updating
      if (input.username || input.email) {
        const [existingByUsername, existingByEmail] = await Promise.all([
          input.username ? this.adminService.findByUsername(input.username) : null,
          input.email ? this.adminService.findByEmail(input.email) : null
        ]);

        if (existingByUsername && existingByUsername.id !== currentAdmin.id) {
          throw new ConflictException('Username already exists');
        }

        if (existingByEmail && existingByEmail.id !== currentAdmin.id) {
          throw new ConflictException('Email already exists');
        }
      }

      const admin = await this.adminService.updateProfile(currentAdmin.id, input);
      
      this.logger.log(`Successfully updated profile for admin: ${currentAdmin.username}`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to update admin profile: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update profile');
    }
  }

  @Mutation(() => Boolean, {
    description: 'Change admin password (self-service)'
  })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('input') input: ChangePasswordGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<boolean> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} changing their password`);
      
      await this.adminService.changePassword(
        currentAdmin.id,
        input.currentPassword,
        input.newPassword
      );
      
      this.logger.log(`Successfully changed password for admin: ${currentAdmin.username}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to change password: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to change password');
    }
  }

  @Mutation(() => Boolean, {
    description: 'Reset admin password (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async resetAdminPassword(
    @Args('input') input: PasswordResetGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<boolean> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} resetting password for admin ID: ${input.adminId}`);
      
      // Prevent self password reset through this endpoint
      if (currentAdmin.id === input.adminId) {
        throw new BadRequestException('Use changePassword mutation to change your own password');
      }

      await this.adminService.resetPassword(input.adminId, input.newPassword, currentAdmin.id);
      
      this.logger.log(`Successfully reset password for admin ID: ${input.adminId} by ${currentAdmin.username}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to reset admin password: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to reset password');
    }
  }

  @Mutation(() => AdminResponseDto, {
    description: 'Deactivate admin account (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async deactivateAdmin(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deactivating admin ID: ${id}`);
      
      // Prevent self-deactivation
      if (currentAdmin.id === id) {
        throw new BadRequestException('You cannot deactivate your own account');
      }

      const admin = await this.adminService.softDelete(id, currentAdmin.id);
      
      this.logger.log(`Successfully deactivated admin: ${admin.username} by ${currentAdmin.username}`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to deactivate admin: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to deactivate admin');
    }
  }

  @Mutation(() => AdminResponseDto, {
    description: 'Reactivate admin account (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async reactivateAdmin(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AdminResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} reactivating admin ID: ${id}`);
      
      const admin = await this.adminService.reactivate(id, currentAdmin.id);
      
      this.logger.log(`Successfully reactivated admin: ${admin.username} by ${currentAdmin.username}`);
      return admin;
    } catch (error) {
      this.logger.error(`Failed to reactivate admin: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to reactivate admin');
    }
  }

  @Mutation(() => Boolean, {
    description: 'Delete admin account permanently (requires SUPER_ADMIN role)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async deleteAdmin(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<boolean> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deleting admin ID: ${id}`);
      
      // Prevent self-deletion
      if (currentAdmin.id === id) {
        throw new BadRequestException('You cannot delete your own account');
      }

      await this.adminService.delete(id, currentAdmin.id);
      
      this.logger.log(`Successfully deleted admin ID: ${id} by ${currentAdmin.username}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete admin: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to delete admin');
    }
  }
}