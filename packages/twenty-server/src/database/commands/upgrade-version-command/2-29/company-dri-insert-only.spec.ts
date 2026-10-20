import { CompanyDriInsertOnlyCommand } from './2-29-workspace-command-1807600000001-company-dri-insert-only.command';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';

jest.mock(
  'src/database/commands/command-runners/active-or-suspended-workspace.command-runner',
  () => ({
    ActiveOrSuspendedWorkspaceCommandRunner: class {
      logger = { log: jest.fn() };
    },
  }),
);
jest.mock(
  'src/database/commands/command-runners/workspace-iterator.service',
  () => ({ WorkspaceIteratorService: class {} }),
);

describe('CompanyDriInsertOnlyCommand', () => {
  const setup = (dryRun = false) => {
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      isTransactionActive: true,
      query: jest
        .fn()
        .mockImplementation(async (sql: string) =>
          sql.startsWith('SELECT')
            ? [{ tableName: 'company', triggerName: 'assign_dri' }]
            : undefined,
        ),
    };
    const dataSource = {
      query: jest.fn(() => {
        throw new Error('Datasource query is prohibited');
      }),
      transaction: jest.fn(() => {
        throw new Error('Datasource transaction is prohibited');
      }),
      createQueryRunner: jest.fn(() => runner),
    };
    const command = new CompanyDriInsertOnlyCommand(
      {} as WorkspaceIteratorService,
    );
    const execute = () =>
      command.runOnWorkspace({
        workspaceId: '8a863524-c447-4bc1-ac35-522a95b00b39',
        dataSource,
        options: { dryRun },
      } as unknown as RunOnWorkspaceArgs);
    return { runner, dataSource, execute };
  };
  it('uses a query runner and commits the trigger cleanup', async () => {
    const { runner, dataSource, execute } = setup();
    await execute();
    expect(dataSource.query).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TRIGGER IF EXISTS'),
    );
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining('BEFORE INSERT ON'),
    );
    expect(
      runner.query.mock.calls.some(([sql]) => sql.includes('INSERT OR UPDATE')),
    ).toBe(false);
    expect(runner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
  it('does not remove triggers in dry run', async () => {
    const { runner, execute } = setup(true);
    await execute();
    expect(
      runner.query.mock.calls.some(([sql]) => sql.startsWith('DROP')),
    ).toBe(false);
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
  it('rolls back and releases the connection on cleanup failure', async () => {
    const { runner, execute } = setup();
    runner.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('CREATE')) throw new Error('cleanup failed');
      return sql.startsWith('SELECT')
        ? [{ tableName: 'company', triggerName: 'assign_dri' }]
        : undefined;
    });
    await expect(execute()).rejects.toThrow('cleanup failed');
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
});
