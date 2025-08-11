import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDate, IsEnum, MaxLength } from 'class-validator';
import { RewardCategory, RewardStatus } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(RewardCategory, {
  name: 'RewardCategory',
  description: 'Categories of reward accounts',
});

registerEnumType(RewardStatus, {
  name: 'RewardStatus',
  description: 'Status of reward accounts',
});

// Base DTO for reward account entity information
@ObjectType('RewardAccountBase')
@InputType('RewardAccountBaseInput')
export class RewardAccountBaseDto {
  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id?: number;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  serviceName: string;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  accountType: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subscriptionDuration?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => RewardCategory)
  @ApiProperty({ enum: RewardCategory })
  @IsEnum(RewardCategory)
  category: RewardCategory;

  @Field(() => RewardStatus, { nullable: true })
  @ApiPropertyOptional({ enum: RewardStatus })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  assignedToUserId?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  assignedAt?: Date;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}