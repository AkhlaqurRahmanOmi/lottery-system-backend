import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import type { Admin } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AdminRepository } from './admin.repository';
import { 
  CreateAdminDto, 
  UpdateAdminDto, 
  AdminQueryDto, 
  PaginatedAdminResponseDto, 
  AdminResponseDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  ChangePasswordDto,
  AdminProfileUpdateDto
} from './dto';

export interface PasswordResetToken {
  token: string;
  adminId: number;
  expiresAt: Date;
}

export interface AdminProfileUpdateData {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable()
export class AdminService {
  private readonly passwordResetTokens = new Map<string, PasswordResetToken>();
  private readonly SALT_ROUNDS = 12;
  private readonly PASSWORD_RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

  constructor(private readonly adminRepository: AdminRepository) {}

  /**
   * Find admin by ID
   */
  async findById(id: number): Promise<Admin | null> {
    return this.adminRepository.findById(id);
  }

  /**
   * Find admin by ID with error handling
   */
  async findByIdOrThrow(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  /**
   * Find admin by username
   */
  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepository.findByUsername(username);
  }

  /**
   * Find admin by email
   */
  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findByEmail(email);
  }

  /**
   * Create new admin
   */
  async create(createAdminDto: CreateAdminDto, createdBy?: number): Promise<AdminResponseDto> {
    const { password, ...adminData } = createAdminDto;

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create admin
    const admin = await this.adminRepository.create({
      ...adminData,
      passwordHash,
    });

    // Log admin creation for audit purposes
    await this.logAdminAction(createdBy || admin.id, 'CREATE_ADMIN', {
      targetAdminId: admin.id,
      targetUsername: admin.username,
      role: admin.role
    });

    // Return response without password hash
    return this.toResponseDto(admin);
  }

  /**
   * Update admin
   */
  async update(id: number, updateAdminDto: UpdateAdminDto, updatedBy?: number): Promise<AdminResponseDto> {
    const { password, ...updateData } = updateAdminDto;

    // Get original admin data for audit logging
    const originalAdmin = await this.findByIdOrThrow(id);

    // Prepare update data
    const dataToUpdate: any = { ...updateData };

    // Hash new password if provided
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    // Update admin
    const admin = await this.adminRepository.update(id, dataToUpdate);

    // Log admin update for audit purposes
    await this.logAdminAction(updatedBy || id, 'UPDATE_ADMIN', {
      targetAdminId: id,
      targetUsername: admin.username,
      changes: this.getChangedFields(originalAdmin, updateData),
      passwordChanged: !!password
    });

    // Return response without password hash
    return this.toResponseDto(admin);
  }

  /**
   * Update admin's last login timestamp
   */
  async updateLastLogin(id: number): Promise<Admin> {
    return this.adminRepository.updateLastLogin(id);
  }

  /**
   * Soft delete admin (deactivate)
   */
  async softDelete(id: number, deactivatedBy?: number): Promise<AdminResponseDto> {
    // Check if admin can be deactivated
    const admin = await this.findByIdOrThrow(id);
    
    if (!admin.isActive) {
      throw new BadRequestException('Admin is already inactive');
    }

    const updatedAdmin = await this.adminRepository.softDelete(id);

    // Log admin deactivation for audit purposes
    await this.logAdminAction(deactivatedBy || id, 'DEACTIVATE_ADMIN', {
      targetAdminId: id,
      targetUsername: admin.username
    });

    return this.toResponseDto(updatedAdmin);
  }

  /**
   * Hard delete admin
   */
  async delete(id: number, deletedBy?: number): Promise<void> {
    // Check if admin exists
    const admin = await this.findByIdOrThrow(id);

    // Check if admin can be deleted
    const canDelete = await this.adminRepository.canDelete(id);
    if (!canDelete) {
      throw new ConflictException('Cannot delete admin who has created coupons. Consider deactivating instead.');
    }

    // Log admin deletion for audit purposes
    await this.logAdminAction(deletedBy || id, 'DELETE_ADMIN', {
      targetAdminId: id,
      targetUsername: admin.username
    });

    await this.adminRepository.delete(id);
  }

  /**
   * Reactivate admin
   */
  async reactivate(id: number, reactivatedBy?: number): Promise<AdminResponseDto> {
    const admin = await this.findByIdOrThrow(id);
    
    if (admin.isActive) {
      throw new BadRequestException('Admin is already active');
    }

    const updatedAdmin = await this.adminRepository.update(id, { isActive: true });

    // Log admin reactivation for audit purposes
    await this.logAdminAction(reactivatedBy || id, 'REACTIVATE_ADMIN', {
      targetAdminId: id,
      targetUsername: admin.username
    });

    return this.toResponseDto(updatedAdmin);
  }

  /**
   * Get all admins with filtering, sorting, and pagination
   */
  async findAll(queryDto: AdminQueryDto): Promise<PaginatedAdminResponseDto> {
    return this.adminRepository.findWithFilters(queryDto);
  }

  /**
   * Search admins
   */
  async search(query: string, limit: number = 10): Promise<AdminResponseDto[]> {
    const admins = await this.adminRepository.search(query, limit);
    return admins.map(admin => this.toResponseDto(admin));
  }

  /**
   * Get admin statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    superAdmins: number;
    regularAdmins: number;
  }> {
    const [total, active, superAdmins] = await Promise.all([
      this.adminRepository.count(),
      this.adminRepository.getActiveCount(),
      this.adminRepository.count({ role: 'SUPER_ADMIN', isActive: true }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      superAdmins,
      regularAdmins: active - superAdmins,
    };
  }

  /**
   * Change admin password
   */
  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this.findByIdOrThrow(id);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.adminRepository.update(id, { passwordHash: newPasswordHash });

    // Log password change for audit purposes
    await this.logAdminAction(id, 'CHANGE_PASSWORD', {
      targetAdminId: id,
      targetUsername: admin.username
    });
  }

  /**
   * Reset admin password (for super admin use)
   */
  async resetPassword(id: number, newPassword: string, resetBy?: number): Promise<void> {
    const admin = await this.findByIdOrThrow(id);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.adminRepository.update(id, { passwordHash });

    // Log password reset for audit purposes
    await this.logAdminAction(resetBy || id, 'RESET_PASSWORD', {
      targetAdminId: id,
      targetUsername: admin.username
    });
  }

  /**
   * Validate admin credentials for authentication
   */
  async validateCredentials(username: string, password: string): Promise<Admin | null> {
    const admin = await this.adminRepository.findByUsername(username);
    
    if (!admin || !admin.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    const admin = await this.findByEmail(email);
    if (!admin || !admin.isActive) {
      throw new NotFoundException('Admin not found or inactive');
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_TOKEN_EXPIRY);

    // Store token in memory (in production, use Redis or database)
    this.passwordResetTokens.set(token, {
      token,
      adminId: admin.id,
      expiresAt
    });

    // Log password reset request for audit purposes
    await this.logAdminAction(admin.id, 'REQUEST_PASSWORD_RESET', {
      targetAdminId: admin.id,
      targetUsername: admin.username,
      email: admin.email
    });

    return token;
  }

  /**
   * Reset password using token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const resetToken = this.passwordResetTokens.get(token);
    
    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetToken.expiresAt) {
      this.passwordResetTokens.delete(token);
      throw new BadRequestException('Reset token has expired');
    }

    const admin = await this.findByIdOrThrow(resetToken.adminId);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.adminRepository.update(admin.id, { passwordHash });

    // Remove used token
    this.passwordResetTokens.delete(token);

    // Log password reset completion for audit purposes
    await this.logAdminAction(admin.id, 'COMPLETE_PASSWORD_RESET', {
      targetAdminId: admin.id,
      targetUsername: admin.username
    });
  }

  /**
   * Update admin profile (self-service)
   */
  async updateProfile(id: number, profileData: AdminProfileUpdateData): Promise<AdminResponseDto> {
    const admin = await this.findByIdOrThrow(id);
    const { currentPassword, newPassword, ...updateData } = profileData;

    // If password change is requested, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      updateData['passwordHash'] = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    }

    // Update profile
    const updatedAdmin = await this.adminRepository.update(id, updateData);

    // Log profile update for audit purposes
    await this.logAdminAction(id, 'UPDATE_PROFILE', {
      targetAdminId: id,
      targetUsername: admin.username,
      changes: this.getChangedFields(admin, updateData),
      passwordChanged: !!newPassword
    });

    return this.toResponseDto(updatedAdmin);
  }

  /**
   * Get admin profile (self-service)
   */
  async getProfile(id: number): Promise<AdminResponseDto> {
    const admin = await this.findByIdOrThrow(id);
    return this.toResponseDto(admin);
  }

  /**
   * Clean up expired password reset tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [token, resetToken] of this.passwordResetTokens.entries()) {
      if (now > resetToken.expiresAt) {
        this.passwordResetTokens.delete(token);
      }
    }
  }

  /**
   * Log admin actions for audit purposes (Requirement 6.6)
   */
  private async logAdminAction(adminId: number, action: string, details: any): Promise<void> {
    // In a real implementation, this would write to an audit log table or service
    // For now, we'll use console.log with structured logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminId,
      action,
      details,
      ip: 'system', // In real implementation, get from request context
      userAgent: 'system' // In real implementation, get from request context
    };

    console.log('AUDIT_LOG:', JSON.stringify(logEntry));
    
    // TODO: In production, implement proper audit logging:
    // - Store in dedicated audit_logs table
    // - Use proper logging service (Winston, etc.)
    // - Include request context (IP, user agent, etc.)
    // - Consider using event-driven architecture for audit logging
  }

  /**
   * Get changed fields for audit logging
   */
  private getChangedFields(original: any, updates: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};
    
    for (const [key, newValue] of Object.entries(updates)) {
      if (key === 'passwordHash') continue; // Don't log password hashes
      if (original[key] !== newValue) {
        changes[key] = {
          from: original[key],
          to: newValue
        };
      }
    }
    
    return changes;
  }

  /**
   * Convert Admin entity to response DTO (excludes password hash)
   */
  private toResponseDto(admin: Admin): AdminResponseDto {
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
  }
}