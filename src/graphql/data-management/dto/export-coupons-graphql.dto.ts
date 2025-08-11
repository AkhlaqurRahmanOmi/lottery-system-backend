import { InputType, Field, Int } from '@nestjs/graphql';
import { ExportFormat } from '../../../modules/export/dto/export-format.enum';

@InputType()
export class ExportCouponsFiltersGraphQLDto {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  batchId?: string;

  @Field(() => Int, { nullable: true })
  createdBy?: number;

  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;
}

@InputType()
export class ExportCouponsGraphQLDto {
  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field({ nullable: true, defaultValue: false })
  includeMetadata?: boolean;

  @Field(() => ExportCouponsFiltersGraphQLDto, { nullable: true })
  filters?: ExportCouponsFiltersGraphQLDto;
}