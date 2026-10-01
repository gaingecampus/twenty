import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const BACKUP_HISTORY = gql`
  query DatabaseBackupHistory {
    databaseBackupHistory {
      available
      runs {
        runId
        status
        startedAt
        completedAt
        durationMs
        fileSizeBytes
        errorMessage
      }
    }
  }
`;

type BackupRun = {
  runId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
};

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledRun = styled.article`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMeta = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.6;
  margin-bottom: 0;
`;

const StyledStatus = styled.strong`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  &[data-status='SUCCESS'] {
    color: ${themeCssVariables.color.green};
  }
  &[data-status='FAILED'] {
    color: ${themeCssVariables.color.red};
  }
  &[data-status='RUNNING'] {
    color: ${themeCssVariables.color.blue};
  }
`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));

export const SettingsDatabaseBackups = () => {
  const client = useApolloAdminClient();
  const { data, loading, error, refetch } = useQuery<{
    databaseBackupHistory: { available: boolean; runs: BackupRun[] };
  }>(BACKUP_HISTORY, {
    client,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const history = data?.databaseBackupHistory;

  return (
    <Section>
      <H2Title
        title="백업 배치 결과"
        description="현재 서버에 기록된 최근 50회 실행 결과 · 한국 시간 기준"
      />
      <Button
        title="새로고침"
        onClick={() => {
          void refetch().catch(() => undefined);
        }}
        disabled={loading}
        variant="secondary"
      />
      {loading && (
        <StyledMeta role="status">백업 결과를 불러오는 중입니다.</StyledMeta>
      )}
      {error && (
        <StyledMeta role="alert">
          백업 결과를 불러오지 못했습니다. 새로고침으로 다시 시도하세요.
        </StyledMeta>
      )}
      {!loading && !error && history && !history.available && (
        <StyledMeta>
          이 서버에는 백업 실행 기록이 아직 없습니다. 백업 배치 설치 및 실행 후
          결과가 표시됩니다.
        </StyledMeta>
      )}
      {!loading &&
        !error &&
        history?.available &&
        history.runs.length === 0 && (
          <StyledMeta>아직 기록된 백업 실행 결과가 없습니다.</StyledMeta>
        )}
      {!error && (
        <StyledList>
          {history?.runs.map((run) => (
            <StyledRun key={run.runId}>
              <StyledStatus data-status={run.status}>
                {{ SUCCESS: '성공', FAILED: '실패', RUNNING: '진행 중' }[
                  run.status
                ] ?? run.status}
              </StyledStatus>
              <StyledMeta>
                시작 {formatDate(run.startedAt)}
                <br />
                완료 {run.completedAt ? formatDate(run.completedAt) : '—'}
                <br />
                소요 시간{' '}
                {run.durationMs === null
                  ? '—'
                  : `${(run.durationMs / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}초`}
                {' · '}파일 크기{' '}
                {run.fileSizeBytes === null
                  ? '—'
                  : `${(run.fileSizeBytes / 1024 / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} MB`}
              </StyledMeta>
              {run.status === 'RUNNING' && (
                <StyledMeta>
                  마지막 기록이 진행 중입니다. 완료 여부는 새로고침으로
                  확인하세요.
                </StyledMeta>
              )}
              {run.errorMessage && (
                <StyledMeta>실패 내용: {run.errorMessage}</StyledMeta>
              )}
            </StyledRun>
          ))}
        </StyledList>
      )}
    </Section>
  );
};
