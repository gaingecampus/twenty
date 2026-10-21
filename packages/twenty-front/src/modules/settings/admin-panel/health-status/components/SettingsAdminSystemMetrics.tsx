import { SettingsAdminSystemAlerts } from '@/settings/admin-panel/health-status/components/SettingsAdminSystemAlerts';
import { currentUserState } from '@/auth/states/currentUserState';
import { useIndicatorMetrics } from '@/settings/admin-panel/health-status/hooks/useIndicatorMetrics';
import {
  parseHealthDetails,
  readHealthMetric,
} from '@/settings/admin-panel/health-status/utils/readHealthMetric';
import {
  StyledDashboardKpiLabel,
  StyledDashboardKpiValue,
  StyledDashboardMuted,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Status } from 'twenty-ui/data-display';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  AdminPanelHealthServiceStatus,
  HealthIndicatorId,
} from '~/generated-admin/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[8]};
  min-width: 0;
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMetrics = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[4]};
  margin: 0;
`;

const StyledMetric = styled.div`
  display: flex;
  flex: 1 1 180px;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledLabel = styled(StyledDashboardKpiLabel)`
  align-self: flex-start;
`;

const StyledMeasurementPath = styled(StyledDashboardMuted)`
  overflow-wrap: anywhere;
`;

const StyledValue = styled(StyledDashboardKpiValue)`
  font-size: ${themeCssVariables.font.size.xl};
  margin: 0;
  overflow-wrap: anywhere;
  white-space: normal;
`;

type Metric = {
  label: string;
  path: string;
  format?: 'bytes' | 'seconds' | 'percent';
};

type MetricsSectionProps = {
  title: string;
  query: ReturnType<typeof useIndicatorMetrics>;
  metrics: Metric[];
  description?: string;
  measurementError?: string;
  warningMessage?: string;
  measurementPath?: string;
};

const MetricsSection = ({
  title,
  query,
  metrics,
  description,
  measurementError,
  warningMessage,
  measurementPath,
}: MetricsSectionProps) => {
  const health = query.data?.getIndicatorHealthStatus;
  const details = parseHealthDetails(health?.details);
  const isHealthy =
    !query.error &&
    !measurementError &&
    health?.status === AdminPanelHealthServiceStatus.OPERATIONAL;
  const timestamp = readHealthMetric(details, 'system.timestamp');
  const measurementDate = new Date(timestamp);
  const measuredAt = Number.isNaN(measurementDate.getTime())
    ? '—'
    : measurementDate.toLocaleTimeString();
  const isInitialLoading = query.loading && !health;

  return (
    <StyledSection aria-label={title} aria-busy={query.loading}>
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>{title}</StyledDashboardSectionTitle>
        <Status
          color={
            isInitialLoading
              ? 'gray'
              : !isHealthy
                ? 'red'
                : warningMessage
                  ? 'orange'
                  : 'green'
          }
          text={
            isInitialLoading
              ? t`연결 중`
              : query.error
                ? t`조회 실패`
                : isHealthy
                  ? warningMessage
                    ? t`주의`
                    : t`정상`
                  : t`확인 필요`
          }
        />
      </StyledDashboardSectionHeader>
      {query.error && (
        <StyledDashboardMuted role="alert">{t`지표를 불러오지 못했습니다. 연결을 확인하거나 다시 새로고침해 주세요.`}</StyledDashboardMuted>
      )}
      {!query.error && health && !isHealthy && (
        <StyledDashboardMuted role="alert">
          {measurementError ??
            t`서비스 상태를 확인할 수 없습니다. 연결을 확인한 뒤 다시 조회해 주세요.`}
        </StyledDashboardMuted>
      )}
      {isHealthy && warningMessage && (
        <StyledDashboardMuted role="alert">
          {warningMessage}
        </StyledDashboardMuted>
      )}
      <StyledMetrics>
        {metrics.map((metric) => (
          <StyledMetric key={metric.path}>
            <StyledLabel as="dt">{metric.label}</StyledLabel>
            <StyledValue as="dd">
              {isHealthy
                ? readHealthMetric(details, metric.path, metric.format)
                : '—'}
            </StyledValue>
          </StyledMetric>
        ))}
      </StyledMetrics>
      {measurementPath && (
        <StyledMeasurementPath>
          {t`측정 경로`}: {measurementPath}
        </StyledMeasurementPath>
      )}
      <StyledDashboardMuted>
        {t`마지막 측정`} {measuredAt}
        {description ? ` · ${description}` : ''}
      </StyledDashboardMuted>
    </StyledSection>
  );
};

export const SettingsAdminSystemMetrics = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const enabled = currentUser?.canAccessFullAdminPanel === true;
  const [polling, setPolling] = useState(true);
  const database = useIndicatorMetrics(
    HealthIndicatorId.database,
    polling,
    enabled,
  );
  const redis = useIndicatorMetrics(HealthIndicatorId.redis, polling, enabled);
  const server = useIndicatorMetrics(HealthIndicatorId.app, polling, enabled);
  const loading = database.loading || redis.loading || server.loading;
  const serverDetails = parseHealthDetails(
    server.data?.getIndicatorHealthStatus.details,
  );
  const serverStorageStatus = readHealthMetric(serverDetails, 'storage.status');
  const storageDetails = parseHealthDetails(
    database.data?.getIndicatorHealthStatus.details,
  );
  const storageSource = readHealthMetric(storageDetails, 'storage.source');
  const storageStatus = readHealthMetric(storageDetails, 'storage.status');
  const storageTimestamp = new Date(
    readHealthMetric(storageDetails, 'storage.availableMeasuredAt'),
  );
  const storageTime = Number.isNaN(storageTimestamp.getTime())
    ? '—'
    : storageTimestamp.toLocaleTimeString();
  const storageDescription =
    storageStatus === 'available'
      ? storageSource === 'docker'
        ? t`Docker 공유 디스크 · DB 전용 할당량 아님 · 1분 간격 수집 · 볼륨 측정 ${storageTime}`
        : t`RDS 할당 용량 · 여유 공간은 CloudWatch 1분 평균 · 볼륨 측정 ${storageTime}`
      : storageStatus === 'partial'
        ? t`RDS 할당 용량 · 여유 공간 수집 대기 또는 조회 권한 없음`
        : storageSource === 'rds'
          ? t`볼륨 지표를 조회하지 못했습니다. RDS·CloudWatch 조회 권한을 확인해 주세요.`
          : t`볼륨 지표를 조회하지 못했습니다. DB 데이터 사용량과 저장 볼륨의 전체 용량은 다릅니다.`;

  if (!enabled) return null;

  const refresh = () => {
    // Each section displays its own failure, including partial outages.
    void Promise.allSettled([
      database.refetch(),
      redis.refetch(),
      server.refetch(),
    ]);
  };

  return (
    <StyledContainer>
      <SettingsAdminSystemAlerts />
      <StyledDashboardSectionHeader>
        <StyledDashboardMuted>
          {polling
            ? t`15초마다 자동 갱신 · 숨겨진 탭에서는 대기`
            : t`자동 갱신 일시정지`}
        </StyledDashboardMuted>
        <StyledActions>
          <Button
            title={polling ? t`일시정지` : t`자동 갱신 시작`}
            variant="secondary"
            size="small"
            onClick={() => setPolling(!polling)}
          />
          <Button
            title={t`새로고침`}
            Icon={IconRefresh}
            variant="secondary"
            size="small"
            disabled={loading}
            onClick={refresh}
          />
        </StyledActions>
      </StyledDashboardSectionHeader>
      <MetricsSection
        title="PostgreSQL"
        query={database}
        description={storageDescription}
        metrics={[
          { label: t`DB 데이터 사용량`, path: 'databaseSize' },
          {
            label: t`저장 볼륨 전체`,
            path: 'storage.totalBytes',
            format: 'bytes',
          },
          {
            label: t`저장 볼륨 여유`,
            path: 'storage.availableBytes',
            format: 'bytes',
          },
          { label: t`전체 연결 수`, path: 'connections.active' },
          { label: t`최대 연결 수`, path: 'connections.max' },
          {
            label: t`연결 사용률`,
            path: 'connections.utilizationPercent',
            format: 'percent',
          },
          { label: t`캐시 적중률`, path: 'performance.cacheHitRatio' },
          { label: t`1분 이상 실행 쿼리`, path: 'performance.slowQueries' },
        ]}
      />
      <MetricsSection
        title="Redis"
        query={redis}
        metrics={[
          { label: t`사용 메모리`, path: 'memory.used' },
          { label: t`최대 사용 메모리`, path: 'memory.peak' },
          { label: t`클라이언트 연결 수`, path: 'connections.current' },
          { label: t`초당 명령 수`, path: 'performance.opsPerSecond' },
          { label: t`캐시 적중률`, path: 'performance.hitRate' },
          { label: t`누적 제거 키`, path: 'performance.evictedKeys' },
        ]}
      />
      <MetricsSection
        title={t`API 서버`}
        query={server}
        description={t`응답한 API 프로세스 기준 · CPU는 측정 구간 평균, 1코어 = 100%`}
        metrics={[
          {
            label: t`CPU 사용률`,
            path: 'runtime.cpuPercent',
            format: 'percent',
          },
          {
            label: t`프로세스 메모리`,
            path: 'runtime.residentMemoryBytes',
            format: 'bytes',
          },
          {
            label: t`사용 힙 메모리`,
            path: 'runtime.heapUsedBytes',
            format: 'bytes',
          },
          {
            label: t`할당 힙 메모리`,
            path: 'runtime.heapTotalBytes',
            format: 'bytes',
          },
          {
            label: t`가동 시간`,
            path: 'runtime.uptimeSeconds',
            format: 'seconds',
          },
          { label: t`Node.js 버전`, path: 'system.nodeVersion' },
        ]}
      />
      <MetricsSection
        title={t`서버 스토리지`}
        query={server}
        description={t`앱 실행 경로의 파일시스템 · 다른 앱과 공유할 수 있음 · S3 파일 용량 제외`}
        measurementPath={readHealthMetric(serverDetails, 'storage.path')}
        warningMessage={
          readHealthMetric(serverDetails, 'storage.level') === 'warning'
            ? t`서버 디스크 여유 공간이 10% 이하입니다.`
            : undefined
        }
        measurementError={
          server.data && serverStorageStatus !== 'available'
            ? t`서버 저장 공간을 조회하지 못했습니다. 실행 경로와 파일시스템 접근 권한을 확인해 주세요.`
            : undefined
        }
        metrics={[
          {
            label: t`디스크 전체`,
            path: 'storage.totalBytes',
            format: 'bytes',
          },
          { label: t`디스크 사용`, path: 'storage.usedBytes', format: 'bytes' },
          {
            label: t`디스크 여유`,
            path: 'storage.availableBytes',
            format: 'bytes',
          },
          {
            label: t`디스크 사용률`,
            path: 'storage.utilizationPercent',
            format: 'percent',
          },
        ]}
      />
    </StyledContainer>
  );
};
