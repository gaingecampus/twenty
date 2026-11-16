import { type DataSource } from 'typeorm';
import { SystemPermissionFlag } from 'twenty-shared/constants';
import { isDepositStatusTransitionAllowed } from 'twenty-shared/utils';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  assertDepositStatusUpdateAllowed,
  canManageDepositStatus,
} from 'src/engine/twenty-orm/utils/deposit-status-permissions.util';

const statuses = [null, 'PENDING', 'SCHEDULED', 'ISSUED', 'PAID'];

describe('deposit status transitions', () => {
  it.each(
    statuses.flatMap((previousStatus) =>
      statuses.map((nextStatus) => [previousStatus, nextStatus]),
    ),
  )(
    '%s -> %s requires the deposit permission unless pending or unchanged',
    (previousStatus, nextStatus) => {
      const allowed =
        previousStatus === nextStatus ||
        (nextStatus === 'PENDING' &&
          !['ISSUED', 'PAID'].includes(String(previousStatus)));
      expect(
        isDepositStatusTransitionAllowed({
          previousStatus,
          nextStatus,
          canManageDepositStatus: false,
        }),
      ).toBe(allowed);
      expect(
        isDepositStatusTransitionAllowed({
          previousStatus,
          nextStatus,
          canManageDepositStatus: true,
        }),
      ).toBe(true);
    },
  );
  it.each(statuses)(
    'only permits pending on ordinary member creation (%s)',
    (nextStatus) => {
      expect(
        isDepositStatusTransitionAllowed({
          nextStatus,
          canManageDepositStatus: false,
          isCreate: true,
        }),
      ).toBe(nextStatus === 'PENDING');
    },
  );
  it('rejects a mixed batch containing a finalized record before writing', () => {
    expect(() =>
      assertDepositStatusUpdateAllowed({ depositStatus: 'PENDING' }, [
        { depositStatus: 'SCHEDULED' },
        { depositStatus: 'PAID' },
      ]),
    ).toThrow();
  });
  it('allows other edits and full-record saves with unchanged final status', () => {
    expect(() =>
      assertDepositStatusUpdateAllowed({ name: 'new name' }, [
        { depositStatus: 'PAID' },
      ]),
    ).not.toThrow();
    expect(() =>
      assertDepositStatusUpdateAllowed({ depositStatus: 'PAID' }, [
        { depositStatus: 'PAID' },
      ]),
    ).not.toThrow();
  });
  it.each([null, () => 'PENDING'])(
    'does not allow null or SQL expressions as status',
    (depositStatus) => {
      expect(() =>
        assertDepositStatusUpdateAllowed({ depositStatus }, [
          { depositStatus: 'PENDING' },
        ]),
      ).toThrow();
    },
  );
});

describe('deposit role authorization', () => {
  const workspaceId = 'workspace';
  const authContext = {
    type: 'user',
    workspace: { id: workspaceId },
    userWorkspaceId: 'user-workspace',
  } as WorkspaceAuthContext;
  const target = jest.fn();
  const role = jest.fn();
  const coreDataSource = {
    getRepository: jest
      .fn()
      .mockReturnValueOnce({ findOne: target })
      .mockReturnValue({ findOne: role }),
  } as unknown as DataSource;
  beforeEach(() => {
    jest.clearAllMocks();
    (coreDataSource.getRepository as jest.Mock)
      .mockReset()
      .mockReturnValueOnce({ findOne: target })
      .mockReturnValue({ findOne: role });
    target.mockResolvedValue({ roleId: 'role' });
    role.mockResolvedValue({
      canUpdateAllSettings: false,
      canAccessAllTools: true,
      rolePermissionFlags: [],
    });
  });
  it('does not grant status management to general action permissions (사일사/Member)', async () => {
    expect(await canManageDepositStatus(authContext, coreDataSource)).toBe(
      false,
    );
  });
  it('permits the explicit flag on a deposit manager role', async () => {
    role.mockResolvedValue({
      rolePermissionFlags: [
        {
          permissionFlag: {
            workspaceId,
            universalIdentifier: SystemPermissionFlag.MANAGE_DEPOSIT_STATUS,
          },
        },
      ],
    });
    expect(await canManageDepositStatus(authContext, coreDataSource)).toBe(
      true,
    );
  });
  it('does not accept a flag from another workspace', async () => {
    role.mockResolvedValue({
      rolePermissionFlags: [
        {
          permissionFlag: {
            workspaceId: 'other',
            universalIdentifier: SystemPermissionFlag.MANAGE_DEPOSIT_STATUS,
          },
        },
      ],
    });
    expect(await canManageDepositStatus(authContext, coreDataSource)).toBe(
      false,
    );
  });
  it('preserves administrator access', async () => {
    role.mockResolvedValue({ canUpdateAllSettings: true });
    expect(await canManageDepositStatus(authContext, coreDataSource)).toBe(
      true,
    );
  });
  it('fails closed when the user role is missing', async () => {
    target.mockResolvedValue(null);
    expect(await canManageDepositStatus(authContext, coreDataSource)).toBe(
      false,
    );
  });
  it('allows internal system operations without granting API users a bypass', async () => {
    expect(
      await canManageDepositStatus(
        {
          type: 'system',
          workspace: { id: workspaceId },
        } as WorkspaceAuthContext,
        coreDataSource,
      ),
    ).toBe(true);
    expect(target).not.toHaveBeenCalled();
  });
  it('resolves the assigned role for API keys', async () => {
    expect(
      await canManageDepositStatus(
        {
          type: 'apiKey',
          workspace: { id: workspaceId },
          apiKey: { id: 'key' },
        } as WorkspaceAuthContext,
        coreDataSource,
      ),
    ).toBe(false);
    expect(target).toHaveBeenCalledWith({
      where: { workspaceId, apiKeyId: 'key' },
    });
  });
});

describe('tax invoice issue date automation', () => {
  it.each(['PENDING', 'SCHEDULED', 'ISSUED', 'PAID'])(
    'allows issueDate updates on %s without changing its status',
    (depositStatus) => {
      const before = [{ depositStatus, issueDate: '2026-11-01' }];
      expect(() =>
        assertDepositStatusUpdateAllowed({ issueDate: '2026-11-16' }, before),
      ).not.toThrow();
      expect(() =>
        assertDepositStatusUpdateAllowed(
          { issueDate: '2026-11-16', depositStatus },
          before,
        ),
      ).not.toThrow();
    },
  );
  it('does not let a date update bypass the completed-state restriction', () => {
    expect(() =>
      assertDepositStatusUpdateAllowed(
        { issueDate: '2026-11-16', depositStatus: 'PENDING' },
        [{ depositStatus: 'PAID' }],
      ),
    ).toThrow();
  });
});
