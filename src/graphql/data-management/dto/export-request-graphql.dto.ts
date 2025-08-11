import { ObjectType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { ExportFormat } from '../../../modules/export/dto/export-format.enum';

// Register the enum for GraphQL
registerEnumType(ExportFormat, {
  name: 'ExportFormat',
  description: 'Available export formats'
});

@ObjectType()
export class ExportResultGraphQLDto {
  @Field()
  data: string; // Base64 encoded file data

  @Field()
  filename: string;

  @Field()
  mimeType: string;

  @Field()
  downloadUrl: string;

  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field()
  recordCount: number;

  @Field()
  generatedAt: Date;
}

@InputType()
export class ExportTemplateRequestGraphQLDto {
  @Field()
  type: string; // 'submissions' or 'coupons'
}

@ObjectType()
export class ExportTemplateFieldGraphQLDto {
  @Field()
  key: string;

  @Field()
  label: string;

  @Field()
  required: boolean;

  @Field()
  type: string;
}

@ObjectType()
export class ExportTemplateGraphQLDto {
  @Field(() => [ExportFormat])
  formats: ExportFormat[];

  @Field(() => [ExportTemplateFieldGraphQLDto])
  fields: ExportTemplateFieldGraphQLDto[];

  @Field(() => [ExportTemplateFieldGraphQLDto])
  optionalFields: ExportTemplateFieldGraphQLDto[];
}

@ObjectType()
export class ExportTemplatesGraphQLDto {
  @Field(() => ExportTemplateGraphQLDto)
  submissions: ExportTemplateGraphQLDto;

  @Field(() => ExportTemplateGraphQLDto)
  coupons: ExportTemplateGraphQLDto;
}