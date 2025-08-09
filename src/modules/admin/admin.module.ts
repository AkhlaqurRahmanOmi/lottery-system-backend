import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { PrismaModule } from '../../core/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}