import { registerEnumType } from '@nestjs/graphql';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf'
}

registerEnumType(ExportFormat, {
  name: 'ExportFormat',
  description: 'Available export formats',
  valuesMap: {
    CSV: {
      description: 'Comma-separated values format',
    },
    EXCEL: {
      description: 'Microsoft Excel format',
    },
    PDF: {
      description: 'Portable Document Format',
    },
  },
});