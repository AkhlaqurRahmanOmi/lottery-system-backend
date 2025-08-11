import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';
import { RewardAccountBaseDto } from './reward-account-base.dto';

// DTO for creating a new reward account
@InputType('CreateRewardAccountInput')
export class CreateRewardAccountDto extends OmitType(RewardAccountBaseDto, [
  'id',
  'status',
  'assignedToUserId',
  'assignedAt',
  'createdAt',
  'updatedAt',
] as const) {
  @Field()
  @ApiProperty({ description: 'Account credentials (will be encrypted)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  credentials: string;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the admin creating the reward account' })
  @IsNotEmpty()
  @IsInt()
  createdBy: number;
}