import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { type DatabaseBackupHistoryDTO } from 'src/engine/core-modules/admin-panel/dtos/database-backup-history.dto';

@Injectable()
export class AdminPanelBackupService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getHistory(): Promise<DatabaseBackupHistoryDTO> {
    const [table] = await this.dataSource.query(
      "SELECT to_regclass('backup_ops.database_backup_runs') IS NOT NULL AS available",
    );

    if (!table.available) {
      return { available: false, runs: [] };
    }

    const runs = await this.dataSource.query(`
      SELECT run_id AS "runId", status, started_at AS "startedAt",
        completed_at AS "completedAt", duration_ms::float8 AS "durationMs",
        file_size_bytes::float8 AS "fileSizeBytes", error_message AS "errorMessage"
      FROM backup_ops.database_backup_runs
      ORDER BY started_at DESC, run_id DESC
      LIMIT 50
    `);

    return { available: true, runs };
  }
}
