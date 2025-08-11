import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionModule } from '../../../modules/submission/submission.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [SubmissionModule],
  controllers: [SubmissionController],
  providers: [ResponseBuilderService],
})
export class SubmissionRestModule {}