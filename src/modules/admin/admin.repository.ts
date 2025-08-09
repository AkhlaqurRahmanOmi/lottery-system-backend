import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { Admin, Prisma, AdminRole } from '@prisma/client';
import { AdminQueryDto, PaginatedAdminResponseDto } from './dto';

export interface AdminSearchFilters {
  search?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface AdminSortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminPaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find admin by ID
     */
    async findById(id: number): Promise<Admin | null> {
        return this.prisma.admin.findUnique({
            where: { id },
        });
    }

    /**
     * Find admin by username
     */
    async findByUsername(username: string): Promise<Admin | null> {
        return this.prisma.admin.findUnique({
            where: { username },
        });
    }

    /**
     * Find admin by email
     */
    async findByEmail(email: string): Promise<Admin | null> {
        return this.prisma.admin.findUnique({
            where: { email },
        });
    }

    /**
     * Check if admin exists by username or email (for uniqueness validation)
     */
    async existsByUsernameOrEmail(username: string, email: string, excludeId?: number): Promise<boolean> {
        const where: Prisma.AdminWhereInput = {
            OR: [
                { username },
                { email }
            ]
        };

        if (excludeId) {
            where.NOT = { id: excludeId };
        }

        const count = await this.prisma.admin.count({ where });
        return count > 0;
    }

    /**
     * Create new admin with uniqueness validation
     */
    async create(data: Prisma.AdminCreateInput): Promise<Admin> {
        try {
            // Check for existing username or email
            const exists = await this.existsByUsernameOrEmail(data.username, data.email);
            if (exists) {
                throw new ConflictException('Admin with this username or email already exists');
            }

            return await this.prisma.admin.create({
                data,
            });
        } catch (error) {
            if (error.code === 'P2002') {
                // Prisma unique constraint violation
                throw new ConflictException('Admin with this username or email already exists');
            }
            throw error;
        }
    }

    /**
     * Update admin with uniqueness validation
     */
    async update(id: number, data: Prisma.AdminUpdateInput): Promise<Admin> {
        try {
            // Check if admin exists
            const existingAdmin = await this.findById(id);
            if (!existingAdmin) {
                throw new NotFoundException(`Admin with ID ${id} not found`);
            }

            // Check for username/email conflicts if they're being updated
            if (data.username || data.email) {
                const username = (data.username as string) || existingAdmin.username;
                const email = (data.email as string) || existingAdmin.email;
                
                const conflicts = await this.existsByUsernameOrEmail(username, email, id);
                if (conflicts) {
                    throw new ConflictException('Admin with this username or email already exists');
                }
            }

            return await this.prisma.admin.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                // Prisma unique constraint violation
                throw new ConflictException('Admin with this username or email already exists');
            }
            if (error.code === 'P2025') {
                // Prisma record not found
                throw new NotFoundException(`Admin with ID ${id} not found`);
            }
            throw error;
        }
    }

    /**
     * Update admin's last login timestamp
     */
    async updateLastLogin(id: number): Promise<Admin> {
        try {
            return await this.prisma.admin.update({
                where: { id },
                data: {
                    lastLogin: new Date(),
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Admin with ID ${id} not found`);
            }
            throw error;
        }
    }

    /**
     * Soft delete admin (deactivate)
     */
    async softDelete(id: number): Promise<Admin> {
        return this.update(id, { isActive: false });
    }

    /**
     * Hard delete admin
     */
    async delete(id: number): Promise<Admin> {
        try {
            return await this.prisma.admin.delete({
                where: { id },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Admin with ID ${id} not found`);
            }
            throw error;
        }
    }

    /**
     * Find many admins with basic parameters
     */
    async findMany(params?: {
        skip?: number;
        take?: number;
        where?: Prisma.AdminWhereInput;
        orderBy?: Prisma.AdminOrderByWithRelationInput;
    }): Promise<Admin[]> {
        const { skip, take, where, orderBy } = params || {};

        return this.prisma.admin.findMany({
            skip,
            take,
            where,
            orderBy,
        });
    }

    /**
     * Count admins with optional filters
     */
    async count(where?: Prisma.AdminWhereInput): Promise<number> {
        return this.prisma.admin.count({ where });
    }

    /**
     * Find admins with advanced filtering, sorting, and pagination
     */
    async findWithFilters(queryDto: AdminQueryDto): Promise<PaginatedAdminResponseDto> {
        const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
        
        // Build where clause
        const where: Prisma.AdminWhereInput = {};

        // Add search filter
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Add role filter
        if (role) {
            where.role = role;
        }

        // Add active status filter
        if (typeof isActive === 'boolean') {
            where.isActive = isActive;
        }

        // Build order by clause
        const orderBy: Prisma.AdminOrderByWithRelationInput = {};
        if (sortBy && ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt', 'lastLogin'].includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute queries
        const [admins, total] = await Promise.all([
            this.prisma.admin.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.admin.count({ where }),
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            data: admins.map(admin => ({
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt,
                lastLogin: admin.lastLogin,
            })),
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        };
    }

    /**
     * Search admins by username or email
     */
    async search(query: string, limit: number = 10): Promise<Admin[]> {
        return this.prisma.admin.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get active admins count
     */
    async getActiveCount(): Promise<number> {
        return this.count({ isActive: true });
    }

    /**
     * Get admins by role
     */
    async findByRole(role: AdminRole): Promise<Admin[]> {
        return this.findMany({
            where: { role, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Check if admin can be deleted (business logic)
     */
    async canDelete(id: number): Promise<boolean> {
        // Check if admin has created any coupons
        const couponCount = await this.prisma.coupon.count({
            where: { createdBy: id }
        });

        // Don't allow deletion if admin has created coupons (for audit trail)
        return couponCount === 0;
    }
}