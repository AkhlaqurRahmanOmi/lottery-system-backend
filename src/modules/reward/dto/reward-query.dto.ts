import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class RewardQueryDto {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @Field({ nullable: true, defaultValue: 'displayOrder' })
  @ApiPropertyOptional({ 
    default: 'displayOrder',
    enum: ['id', 'name', 'displayOrder', 'createdAt', 'updatedAt']
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'name', 'displayOrder', 'createdAt', 'updatedAt'])
  sortBy?: string = 'displayOrder';

  @Field({ nullable: true, defaultValue: 'asc' })
  @ApiPropertyOptional({ default: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}