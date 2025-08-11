import { Module } from '@nestjs/common';
import { SubmissionResolver } from './submission.resolver';
import { SubmissionModule } from '../../modules/submission/submission.module';

@Module({
  imports: [SubmissionModule],
  providers: [SubmissionResolver],
  exports: [SubmissionResolver],
})
export class SubmissionGraphQLModule {}