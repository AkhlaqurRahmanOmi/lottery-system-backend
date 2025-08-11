import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportModule as CoreExportModule } from '../../../modules/export/export.module';

@Module({
  imports: [CoreExportModule],
  controllers: [ExportController]
})
export class ExportRestModule {}