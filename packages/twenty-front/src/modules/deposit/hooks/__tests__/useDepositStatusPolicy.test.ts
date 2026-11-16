import { renderHook } from '@testing-library/react';
import { useDepositStatusPolicy } from '@/deposit/hooks/useDepositStatusPolicy';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const mockHasPermission = jest.fn();
jest.mock('@/settings/roles/hooks/useHasPermissionFlag', () => ({
  useHasPermissionFlag: (flag: PermissionFlagType) => mockHasPermission(flag),
}));
beforeEach(() => mockHasPermission.mockReturnValue(false));

it.each(['ISSUED', 'PAID'])(
  'locks completed deposit status %s for 사일사',
  (value) => {
    const { result } = renderHook(() =>
      useDepositStatusPolicy({
        objectNameSingular: 'deposit',
        fieldName: 'depositStatus',
        value,
      }),
    );
    expect(result.current).toEqual({ isRestricted: true, isReadOnly: true });
    expect(mockHasPermission).toHaveBeenCalledWith(
      PermissionFlagType.MANAGE_DEPOSIT_STATUS,
    );
  },
);
it.each([undefined, null, 'PENDING', 'SCHEDULED'])(
  'allows pending selection from %s for 사일사',
  (value) => {
    const { result } = renderHook(() =>
      useDepositStatusPolicy({
        objectNameSingular: 'deposit',
        fieldName: 'depositStatus',
        value,
      }),
    );
    expect(result.current).toEqual({ isRestricted: true, isReadOnly: false });
  },
);
it('permits the deposit manager to edit a completed state', () => {
  mockHasPermission.mockReturnValue(true);
  const { result } = renderHook(() =>
    useDepositStatusPolicy({
      objectNameSingular: 'deposit',
      fieldName: 'depositStatus',
      value: 'PAID',
    }),
  );
  expect(result.current).toEqual({ isRestricted: false, isReadOnly: false });
});
it('leaves other objects and fields under their existing permissions', () => {
  const { result } = renderHook(() =>
    useDepositStatusPolicy({
      objectNameSingular: 'opportunity',
      fieldName: 'depositStatus',
      value: 'PAID',
    }),
  );
  expect(result.current.isRestricted).toBe(false);
});
