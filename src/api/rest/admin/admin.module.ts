import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminModule as CoreAdminModule } from '../../../modules/admin/admin.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [CoreAdminModule],
  controllers: [AdminController],
  providers: [ResponseBuilderService],
})
export class AdminRestModule {}