import { InputType, Field } from '@nestjs/graphql';
import { ExportFormat } from '../../../modules/export/dto/export-format.enum';

@InputType()
export class ExportSubmissionsFiltersGraphQLDto {
  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;

  @Field({ nullable: true })
  hasReward?: boolean;

  @Field({ nullable: true })
  couponBatchId?: string;

  @Field({ nullable: true })
  rewardCategory?: string;
}

@InputType()
export class ExportSubmissionsGraphQLDto {
  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field({ nullable: true, defaultValue: false })
  includeMetadata?: boolean;

  @Field(() => ExportSubmissionsFiltersGraphQLDto, { nullable: true })
  filters?: ExportSubmissionsFiltersGraphQLDto;
}