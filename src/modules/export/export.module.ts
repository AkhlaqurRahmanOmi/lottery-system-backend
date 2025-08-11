import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { PrismaModule } from '../../core/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExportService],
  exports: [ExportService]
})
export class ExportModule {}