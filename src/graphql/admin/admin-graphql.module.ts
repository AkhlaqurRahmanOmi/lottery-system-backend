import { Module } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { AdminModule } from '../../modules/admin/admin.module';

@Module({
  imports: [AdminModule],
  providers: [AdminResolver],
  exports: [AdminResolver],
})
export class AdminGraphQLModule {}