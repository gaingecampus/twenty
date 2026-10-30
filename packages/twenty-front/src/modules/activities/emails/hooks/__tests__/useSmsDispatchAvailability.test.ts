import { renderHook } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';

jest.mock('@apollo/client/react', () => ({ useQuery: jest.fn() }));
jest.mock('@/settings/roles/hooks/useHasPermissionFlag', () => ({
  useHasPermissionFlag: jest.fn(),
}));

describe('SMS availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useHasPermissionFlag as jest.Mock).mockReturnValue(true);
  });
  it.each([
    { loading: true, data: { isSmsDispatchAvailable: true } },
    { error: new Error('unavailable'), data: { isSmsDispatchAvailable: true } },
    { data: undefined },
    { data: { isSmsDispatchAvailable: false } },
  ])('fails closed while unavailable, loading or errored', (response) => {
    (useQuery as unknown as jest.Mock).mockReturnValue(response);
    expect(renderHook(() => useSmsDispatchAvailability()).result.current).toBe(
      false,
    );
  });
  it('requires a fresh positive readiness response', () => {
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: { isSmsDispatchAvailable: true },
    });
    expect(renderHook(() => useSmsDispatchAvailability()).result.current).toBe(
      true,
    );
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), {
      skip: false,
      fetchPolicy: 'network-only',
    });
  });
  it('does not query or expose SMS without workspace management permission', () => {
    (useHasPermissionFlag as jest.Mock).mockReturnValue(false);
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: { isSmsDispatchAvailable: true },
    });
    expect(renderHook(() => useSmsDispatchAvailability()).result.current).toBe(
      false,
    );
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      fetchPolicy: 'network-only',
    });
  });
});
