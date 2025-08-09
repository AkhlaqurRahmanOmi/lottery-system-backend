import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthModule } from '../../modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AuthResolver],
  exports: [AuthResolver],
})
export class AuthGraphQLModule {}