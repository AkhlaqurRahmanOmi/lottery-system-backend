import { Module } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { AdminModule } from '../../modules/admin/admin.module';
// Import to register AdminRole enum with GraphQL
import '../enums/admin-role.enum';

@Module({
  imports: [AdminModule],
  providers: [AdminResolver],
  exports: [AdminResolver],
})
export class AdminGraphQLModule {}