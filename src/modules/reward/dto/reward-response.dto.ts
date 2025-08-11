import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { RewardBaseDto } from './reward-base.dto';

@ObjectType()
export class RewardResponseDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  name: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({ required: false })
  description?: string | null;

  @Field(() => String, { nullable: true })
  @ApiProperty({ required: false })
  imageUrl?: string | null;

  @Field()
  @ApiProperty()
  isActive: boolean;

  @Field(() => Int)
  @ApiProperty()
  displayOrder: number;

  @Field(() => Date)
  @ApiProperty()
  createdAt: Date;

  @Field(() => Date)
  @ApiProperty()
  updatedAt: Date;
}

@ObjectType()
export class PaginatedRewardResponseDto {
  @Field(() => [RewardResponseDto])
  @ApiProperty({ type: [RewardResponseDto] })
  data: RewardResponseDto[];

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