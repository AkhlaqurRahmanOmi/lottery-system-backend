import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { AdminBaseDto, AdminRole } from './admin-base.dto';

// Admin response DTO that excludes sensitive information
@ObjectType('AdminResponse')
export class AdminResponseDto extends OmitType(AdminBaseDto, []) {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  username: string;

  @Field()
  @ApiProperty()
  email: string;

  @Field(() => AdminRole)
  @ApiProperty({ enum: AdminRole })
  role: AdminRole;

  @Field()
  @ApiProperty()
  isActive: boolean;

  @Field(() => Date)
  @ApiProperty()
  createdAt: Date;

  @Field(() => Date)
  @ApiProperty()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @ApiPropertyOptional()
  lastLogin?: Date | null;
}

// Paginated admin response
@ObjectType('PaginatedAdminResponse')
export class PaginatedAdminResponseDto {
  @Field(() => [AdminResponseDto])
  @ApiProperty({ type: [AdminResponseDto] })
  data: AdminResponseDto[];

  @Field(() => Int)
  @ApiProperty()
  total: number;

  @Field(() => Int)
  @ApiProperty()
  page: number;

  @Field(() => Int)
  @ApiProperty()
  limit: number;

  @Field(() => Int)
  @ApiProperty()
  totalPages: number;

  @Field()
  @ApiProperty()
  hasNextPage: boolean;

  @Field()
  @ApiProperty()
  hasPreviousPage: boolean;
}