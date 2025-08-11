import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// DTO for assigning a reward account to a user
@InputType('AssignRewardInput')
export class AssignRewardDto {
  @Field(() => Int)
  @ApiProperty({ description: 'ID of the reward account to assign' })
  @IsNotEmpty()
  @IsInt()
  rewardAccountId: number;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the user submission to assign the reward to' })
  @IsNotEmpty()
  @IsInt()
  submissionId: number;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the admin assigning the reward' })
  @IsNotEmpty()
  @IsInt()
  assignedBy: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Optional notes about the assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}