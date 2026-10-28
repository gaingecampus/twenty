import { RenameCustomerClassificationCommand } from './2-30-workspace-command-1807800000002-rename-customer-classification.command';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';

describe('customer classification labels migration', () => {
  const setup = () => {
    const runner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: true,
    };
    const dataSource = { createQueryRunner: jest.fn().mockReturnValue(runner) };
    const cache = { invalidateAndRecompute: jest.fn() };
    const version = { incrementMetadataVersion: jest.fn() };
    type Dependencies = ConstructorParameters<
      typeof RenameCustomerClassificationCommand
    >;
    const command = new RenameCustomerClassificationCommand(
      {} as Dependencies[0],
      cache as unknown as Dependencies[1],
      version as unknown as Dependencies[2],
    );
    const args = {
      workspaceId: 'test-workspace',
      dataSource,
      options: { dryRun: false },
    } as unknown as RunOnWorkspaceArgs;
    return { command, runner, dataSource, cache, version, args };
  };
  it('does not write during dry-run', async () => {
    const { command, args, dataSource } = setup();
    await command.runOnWorkspace({ ...args, options: { dryRun: true } });
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });
  it('scopes every update to the workspace and updates display columns only', async () => {
    const { command, args, runner, cache } = setup();
    await command.runOnWorkspace(args);
    expect(runner.query).toHaveBeenCalled();
    for (const [sql, parameters] of runner.query.mock.calls) {
      expect(sql).toContain('WHERE "workspaceId"=$1');
      expect(parameters[0]).toBe('test-workspace');
      expect(sql).not.toContain('UPDATE workspace_');
    }
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(cache.invalidateAndRecompute).toHaveBeenCalled();
  });
  it('rolls back and leaves caches alone if an update fails', async () => {
    const { command, args, runner, cache } = setup();
    runner.query.mockRejectedValueOnce(new Error('write failed'));
    await expect(command.runOnWorkspace(args)).rejects.toThrow('write failed');
    expect(runner.rollbackTransaction).toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
    expect(cache.invalidateAndRecompute).not.toHaveBeenCalled();
  });
});
