import { PartialType, OmitType } from '@nestjs/swagger';
import { InputType } from '@nestjs/graphql';
import { SubmissionBaseDto } from './submission-base.dto';

@InputType()
export class UpdateSubmissionDto extends PartialType(
  OmitType(SubmissionBaseDto, ['id', 'couponId', 'submittedAt'] as const)
) {
  // Allow updating most fields except ID, couponId, and submittedAt
}