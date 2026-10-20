import { Module } from '@nestjs/common';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { CompanyDriInsertOnlyCommand } from './2-29-workspace-command-1807600000001-company-dri-insert-only.command';

@Module({
  imports: [WorkspaceIteratorModule],
  providers: [CompanyDriInsertOnlyCommand],
})
export class V2_29_UpgradeVersionCommandModule {}
