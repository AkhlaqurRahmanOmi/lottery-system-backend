import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { CreateRewardAccountDto } from './create-reward-account.dto';

// DTO for updating an existing reward account
@InputType('UpdateRewardAccountInput')
export class UpdateRewardAccountDto extends PartialType(
  OmitType(CreateRewardAccountDto, ['createdBy'] as const),
) {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'New account credentials (will be encrypted)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  credentials?: string;
}