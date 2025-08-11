import { Module } from '@nestjs/common';
import { ExportResolver } from './export.resolver';
import { ExportModule as CoreExportModule } from '../../modules/export/export.module';

@Module({
  imports: [CoreExportModule],
  providers: [ExportResolver]
})
export class ExportGraphQLModule {}