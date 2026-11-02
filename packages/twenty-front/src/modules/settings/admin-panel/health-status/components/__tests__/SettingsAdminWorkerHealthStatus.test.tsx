import { render, screen } from '@testing-library/react';
import { SettingsAdminWorkerHealthStatus } from '@/settings/admin-panel/health-status/components/SettingsAdminWorkerHealthStatus';
import { SettingsAdminIndicatorHealthContext } from '@/settings/admin-panel/health-status/contexts/SettingsAdminIndicatorHealthContext';
import {
  AdminPanelHealthServiceStatus,
  HealthIndicatorId,
} from '~/generated-admin/graphql';

jest.mock(
  '@/settings/admin-panel/health-status/components/SettingsAdminWorkerQueueMetricsSection',
  () => ({
    SettingsAdminWorkerQueueMetricsSection: ({
      queue,
      errorMessage,
      showMetrics,
    }: {
      queue: { queueName: string };
      errorMessage?: string;
      showMetrics: boolean;
    }) => (
      <section aria-label={queue.queueName}>
        {errorMessage}
        {showMetrics && <span>metrics</span>}
      </section>
    ),
  }),
);

const renderHealth = (details: string, errorMessage = 'Worker check failed') =>
  render(
    <SettingsAdminIndicatorHealthContext.Provider
      value={{
        indicatorHealth: {
          id: HealthIndicatorId.worker,
          label: 'Worker',
          description: '',
          status: AdminPanelHealthServiceStatus.OUTAGE,
          errorMessage,
          details,
          queues: [
            {
              id: 'cron',
              queueName: 'cron-queue',
              status: AdminPanelHealthServiceStatus.OPERATIONAL,
            },
            {
              id: 'email',
              queueName: 'email-queue',
              status: AdminPanelHealthServiceStatus.OUTAGE,
            },
          ],
        },
      }}
    >
      <SettingsAdminWorkerHealthStatus />
    </SettingsAdminIndicatorHealthContext.Provider>,
  );

describe('SettingsAdminWorkerHealthStatus', () => {
  it('shows the affected queue and retains metrics for a healthy queue during partial outage', () => {
    renderHealth(
      JSON.stringify({
        queues: [
          { queueName: 'cron-queue', workers: 1 },
          {
            queueName: 'email-queue',
            workers: 0,
            errorMessage: 'Redis 인증 또는 명령 실행 권한 오류',
          },
        ],
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      '일부 큐의 상태를 확인하지 못했습니다.',
    );
    expect(
      screen.getByRole('region', { name: 'cron-queue' }),
    ).toHaveTextContent('metrics');
    expect(
      screen.getByRole('region', { name: 'email-queue' }),
    ).toHaveTextContent('Redis 인증 또는 명령 실행 권한 오류');
    expect(
      screen.getByRole('region', { name: 'email-queue' }),
    ).not.toHaveTextContent('metrics');
    expect(
      screen.queryByText(
        'Queue information is not available because the worker is down',
      ),
    ).not.toBeInTheDocument();
  });

  it('keeps queue diagnostics and graphs accessible for a high failure rate', () => {
    renderHealth(
      JSON.stringify({
        queues: [
          {
            queueName: 'email-queue',
            workers: 1,
            errorMessage:
              '최근 60분 실패율 60% (실패 6건 / 전체 10건, 기준 20% 초과)',
          },
        ],
      }),
      'Worker queue failure or unprocessed work detected',
    );
    expect(
      screen.getByRole('region', { name: 'email-queue' }),
    ).toHaveTextContent('실패 6건');
    expect(
      screen.getByRole('region', { name: 'email-queue' }),
    ).toHaveTextContent('metrics');
  });

  it('handles older or malformed diagnostics without hiding queues', () => {
    renderHealth('invalid json', 'No active workers found');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '실행 중인 워커가 감지되지 않았습니다.',
    );
    expect(
      screen.getByRole('region', { name: 'email-queue' }),
    ).toHaveTextContent('큐 상태를 확인해 주세요.');
  });
});
