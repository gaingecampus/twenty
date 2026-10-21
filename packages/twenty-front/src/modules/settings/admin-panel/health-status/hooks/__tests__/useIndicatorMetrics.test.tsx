import { useIndicatorMetrics } from '@/settings/admin-panel/health-status/hooks/useIndicatorMetrics';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import {
  AdminPanelHealthServiceStatus,
  GetIndicatorHealthStatusDocument,
  HealthIndicatorId,
} from '~/generated-admin/graphql';

const result = jest.fn(() => ({
  data: {
    getIndicatorHealthStatus: {
      id: HealthIndicatorId.database,
      label: 'Database',
      description: 'Database health',
      status: AdminPanelHealthServiceStatus.OPERATIONAL,
      errorMessage: null,
      details: JSON.stringify({ details: { connections: { active: 0 } } }),
      queues: null,
    },
  },
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MockedProvider
    mocks={[
      {
        request: {
          query: GetIndicatorHealthStatusDocument,
          variables: { indicatorId: HealthIndicatorId.database },
        },
        result,
        maxUsageCount: Infinity,
        delay: 0,
      },
    ]}
  >
    {children}
  </MockedProvider>
);

const advance = async (milliseconds: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('useIndicatorMetrics', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    result.mockClear();
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('polls, pauses, refreshes manually, and stops after unmount', async () => {
    const hook = renderHook(
      ({ polling }) =>
        useIndicatorMetrics(HealthIndicatorId.database, polling, true),
      {
        initialProps: { polling: true },
        wrapper: Wrapper,
      },
    );
    await advance(1);
    expect(result).toHaveBeenCalledTimes(1);
    await advance(5000);
    expect(result).toHaveBeenCalledTimes(1);
    await advance(10001);
    expect(result).toHaveBeenCalledTimes(2);

    hook.rerender({ polling: false });
    await advance(30000);
    expect(result).toHaveBeenCalledTimes(2);
    act(() => {
      void hook.result.current.refetch();
    });
    await advance(1);
    expect(result).toHaveBeenCalledTimes(3);

    hook.rerender({ polling: true });
    await advance(15001);
    expect(result).toHaveBeenCalledTimes(4);
    hook.unmount();
    await advance(30000);
    expect(result).toHaveBeenCalledTimes(4);
  });

  it('skips background polling and resumes when visible', async () => {
    renderHook(
      () => useIndicatorMetrics(HealthIndicatorId.database, true, true),
      { wrapper: Wrapper },
    );
    await advance(1);
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await advance(30000);
    expect(result).toHaveBeenCalledTimes(1);
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await advance(15001);
    expect(result).toHaveBeenCalledTimes(2);
  });

  it('recovers from a failed refresh on the next poll', async () => {
    const request = {
      query: GetIndicatorHealthStatusDocument,
      variables: { indicatorId: HealthIndicatorId.database },
    };
    const RecoveryWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={[
          { request, result, delay: 0 },
          { request, error: new Error('Connection unavailable'), delay: 0 },
          { request, result, delay: 0 },
        ]}
      >
        {children}
      </MockedProvider>
    );
    const hook = renderHook(
      () => useIndicatorMetrics(HealthIndicatorId.database, true, true),
      { wrapper: RecoveryWrapper },
    );
    await advance(1);
    expect(hook.result.current.error).toBeUndefined();
    await advance(15001);
    expect(hook.result.current.error).toBeDefined();
    await advance(15001);
    expect(hook.result.current.error).toBeUndefined();
    expect(hook.result.current.data?.getIndicatorHealthStatus.status).toBe(
      AdminPanelHealthServiceStatus.OPERATIONAL,
    );
  });

  it('does not request metrics without admin access', async () => {
    renderHook(
      () => useIndicatorMetrics(HealthIndicatorId.database, true, false),
      { wrapper: Wrapper },
    );
    await advance(30000);
    expect(result).not.toHaveBeenCalled();
  });
});
