import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ExportResult } from '../../../../modules/export/dto';

export class ExportResultRestDto extends OmitType(ExportResult, []) {
  @ApiProperty({
    description: 'Export data as base64 string',
    example: 'data:text/csv;base64,aWQsY291cG9uQ29kZS4uLg=='
  })
  declare data: string;

  @ApiProperty({
    description: 'Generated filename',
    example: 'submissions_export_2024-01-15.csv'
  })
  declare filename: string;

  @ApiProperty({
    description: 'MIME type of the export',
    example: 'text/csv'
  })
  declare mimeType: string;
}