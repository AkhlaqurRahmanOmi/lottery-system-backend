import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as CoreAuthModule } from '../../../modules/auth/auth.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [CoreAuthModule],
  controllers: [AuthController],
  providers: [ResponseBuilderService],
})
export class AuthRestModule {}