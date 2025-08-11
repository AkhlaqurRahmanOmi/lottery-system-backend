import { InputType, Field, Int, OmitType } from '@nestjs/graphql';
import { CreateSubmissionDto } from '../../../modules/submission/dto';
import { IsOptional, IsInt } from 'class-validator';

/**
 * GraphQL Input DTO for creating user submissions without reward selection
 * Users no longer select rewards - admins assign them later
 */
@InputType('CreateSubmissionInput')
export class CreateSubmissionGraphQLDto extends OmitType(CreateSubmissionDto, ['selectedRewardId']) {
  // selectedRewardId is now optional and handled internally
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  selectedRewardId?: number;
}