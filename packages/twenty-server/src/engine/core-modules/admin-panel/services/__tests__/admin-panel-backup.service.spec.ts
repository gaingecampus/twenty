import { type DataSource } from 'typeorm';

import { AdminPanelBackupService } from 'src/engine/core-modules/admin-panel/services/admin-panel-backup.service';

describe('AdminPanelBackupService', () => {
  const query = jest.fn();
  const service = new AdminPanelBackupService({
    query,
  } as unknown as DataSource);

  beforeEach(() => query.mockReset());

  it('returns an unavailable state without querying a missing history table', async () => {
    query.mockResolvedValueOnce([{ available: false }]);
    await expect(service.getHistory()).resolves.toEqual({
      available: false,
      runs: [],
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reads bounded history in latest-first order without exposing S3 paths', async () => {
    const runs = [{ runId: 'run-1', status: 'SUCCESS' }];
    query
      .mockResolvedValueOnce([{ available: true }])
      .mockResolvedValueOnce(runs);
    await expect(service.getHistory()).resolves.toEqual({
      available: true,
      runs,
    });
    const sql = query.mock.calls[1][0];
    expect(sql).toContain('ORDER BY started_at DESC, run_id DESC');
    expect(sql).toContain('LIMIT 50');
    expect(sql).not.toContain('s3_path');
  });

  it('does not present a database failure as empty history', async () => {
    query.mockRejectedValueOnce(new Error('unavailable'));
    await expect(service.getHistory()).rejects.toThrow('unavailable');
  });
});
