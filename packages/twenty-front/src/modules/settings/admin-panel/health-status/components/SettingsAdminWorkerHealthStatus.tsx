import { SettingsAdminWorkerQueueMetricsSection } from '@/settings/admin-panel/health-status/components/SettingsAdminWorkerQueueMetricsSection';
import { SettingsAdminIndicatorHealthContext } from '@/settings/admin-panel/health-status/contexts/SettingsAdminIndicatorHealthContext';
import { getWorkerHealthDiagnostics } from '@/settings/admin-panel/health-status/utils/getWorkerHealthDiagnostics';
import { StyledDashboardMuted } from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { AdminPanelHealthServiceStatus } from '~/generated-admin/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledErrorMessage = styled.div`
  color: ${themeCssVariables.color.red};
  overflow-wrap: anywhere;
`;

export const SettingsAdminWorkerHealthStatus = () => {
  const { indicatorHealth } = useContext(SettingsAdminIndicatorHealthContext);
  const diagnostics = getWorkerHealthDiagnostics(indicatorHealth.details);
  const queues = [...(indicatorHealth.queues ?? [])].sort(
    (left, right) =>
      Number(right.status === AdminPanelHealthServiceStatus.OUTAGE) -
      Number(left.status === AdminPanelHealthServiceStatus.OUTAGE),
  );
  const isWorkerDown =
    !indicatorHealth.status ||
    indicatorHealth.status === AdminPanelHealthServiceStatus.OUTAGE;
  const errorMessage = indicatorHealth.errorMessage;
  const summary =
    errorMessage === 'No active workers found'
      ? t`실행 중인 워커가 감지되지 않았습니다.`
      : errorMessage === 'Worker check timeout'
        ? t`워커 상태 조회 시간이 초과되었습니다. 워커 중지 여부는 확인되지 않았습니다.`
        : errorMessage === 'Worker check failed'
          ? t`일부 큐의 상태를 확인하지 못했습니다.`
          : errorMessage === 'Worker queue failure or unprocessed work detected'
            ? t`작업 실패율 초과 또는 처리할 워커가 없는 큐가 있습니다.`
            : errorMessage || t`워커 상태를 확인할 수 없습니다.`;

  return (
    <StyledContainer>
      <StyledDashboardMuted>
        {t`최근 1시간 실패율 20% 초과 시 장애로 표시합니다. 과거 실패 기록은 작업 목록에 유지됩니다.`}
      </StyledDashboardMuted>
      {isWorkerDown && (
        <StyledErrorMessage role="alert">{summary}</StyledErrorMessage>
      )}
      {queues.map((queue) => {
        const diagnostic = diagnostics.find(
          (item) => item.queueName === queue.queueName,
        );

        return (
          <SettingsAdminWorkerQueueMetricsSection
            key={queue.queueName}
            queue={queue}
            errorMessage={
              diagnostic?.errorMessage ??
              (queue.status === AdminPanelHealthServiceStatus.OUTAGE
                ? t`큐 상태를 확인해 주세요.`
                : undefined)
            }
            showMetrics={diagnostic?.workers !== 0}
          />
        );
      })}
    </StyledContainer>
  );
};
