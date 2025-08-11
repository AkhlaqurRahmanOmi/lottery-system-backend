import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ExportResult')
export class ExportResult {
  @Field()
  @ApiProperty({
    description: 'Export data as base64 string',
    example: 'data:text/csv;base64,aWQsY291cG9uQ29kZS4uLg=='
  })
  data: string;

  @Field()
  @ApiProperty({
    description: 'Generated filename',
    example: 'submissions_export_2024-01-15.csv'
  })
  filename: string;

  @Field()
  @ApiProperty({
    description: 'MIME type of the export',
    example: 'text/csv'
  })
  mimeType: string;
}