import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { SubmissionResponseDto } from '../../../modules/submission/dto/submission-response.dto';

@InputType()
export class SubmissionSearchFiltersGraphQLDto {
  @Field({ nullable: true })
  query?: string;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;

  @Field({ nullable: true })
  hasReward?: boolean;

  @Field({ nullable: true })
  couponBatchId?: string;

  @Field({ nullable: true })
  rewardCategory?: string;

  @Field({ nullable: true })
  couponStatus?: string;
}

@InputType()
export class SubmissionSearchQueryGraphQLDto {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;

  @Field({ nullable: true, defaultValue: 'submittedAt' })
  sortBy?: string;

  @Field({ nullable: true, defaultValue: 'desc' })
  sortOrder?: string;

  @Field(() => SubmissionSearchFiltersGraphQLDto, { nullable: true })
  filters?: SubmissionSearchFiltersGraphQLDto;
}

@ObjectType()
export class PaginationInfoGraphQLDto {
  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  itemsPerPage: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class SubmissionSearchResultGraphQLDto {
  @Field(() => [SubmissionResponseDto])
  data: SubmissionResponseDto[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}