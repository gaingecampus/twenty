import { renderHook } from '@testing-library/react';
import { billingState } from '@/client-config/states/billingState';
import { useIsSelfHosted } from '@/client-config/hooks/useIsSelfHosted';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue');

const mockUseAtomStateValue = jest.mocked(useAtomStateValue);

describe('useIsSelfHosted', () => {
  it.each([
    [null, false],
    [{ isBillingEnabled: false }, true],
    [{ isBillingEnabled: true }, false],
  ])('resolves billing configuration %j to %s', (billing, expected) => {
    mockUseAtomStateValue.mockReturnValue(billing);
    const { result } = renderHook(() => useIsSelfHosted());
    expect(result.current).toBe(expected);
    expect(mockUseAtomStateValue).toHaveBeenCalledWith(billingState);
  });
});
