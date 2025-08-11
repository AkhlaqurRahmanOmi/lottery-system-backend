import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class AssignRewardToSubmissionDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Submission ID to assign reward to' })
  @IsNotEmpty()
  @IsInt()
  submissionId: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Reward account ID to assign' })
  @IsNotEmpty()
  @IsInt()
  rewardAccountId: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Optional notes about the assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class BulkAssignRewardDto {
  @Field(() => [Int])
  @ApiProperty({ type: [Number], description: 'Array of submission IDs to assign rewards to' })
  @IsNotEmpty()
  @IsInt({ each: true })
  submissionIds: number[];

  @Field(() => [Int])
  @ApiProperty({ type: [Number], description: 'Array of reward account IDs to assign (must match submissionIds length)' })
  @IsNotEmpty()
  @IsInt({ each: true })
  rewardAccountIds: number[];

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Optional notes about the bulk assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}