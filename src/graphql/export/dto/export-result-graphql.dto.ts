import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ExportResultGraphQL')
export class ExportResultGraphQLDto {
  @Field({ description: 'Export data as base64 string' })
  data: string;

  @Field({ description: 'Generated filename' })
  filename: string;

  @Field({ description: 'MIME type of the export' })
  mimeType: string;
}