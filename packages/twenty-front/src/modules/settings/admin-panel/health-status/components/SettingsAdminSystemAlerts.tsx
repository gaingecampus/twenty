import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import {
  StyledDashboardMuted,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Status } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const FIELDS = gql`
  fragment SystemAlertSettingsFields on SystemAlertSettingsDTO {
    enabled
    recipients
    monitorRunning
    mailConfigured
    lastCheckedAt
    lastSentAt
    lastError
    lastTestAt
    activeIssues
  }
`;
const QUERY = gql`
  query SystemAlertSettings {
    systemAlertSettings {
      ...SystemAlertSettingsFields
    }
  }
  ${FIELDS}
`;
const UPDATE = gql`
  mutation UpdateSystemAlertSettings($input: UpdateSystemAlertSettingsInput!) {
    updateSystemAlertSettings(input: $input) {
      ...SystemAlertSettingsFields
    }
  }
  ${FIELDS}
`;
const TEST = gql`
  mutation SendSystemAlertTest {
    sendSystemAlertTest
  }
`;

type Settings = {
  enabled: boolean;
  recipients: string[];
  monitorRunning: boolean;
  mailConfigured: boolean;
  lastCheckedAt?: string;
  lastSentAt?: string;
  lastError?: string;
  lastTestAt?: string;
  activeIssues: string[];
};
const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;
const StyledRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledAddress = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;
const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : '—';

export const SettingsAdminSystemAlerts = () => {
  const client = useApolloAdminClient();
  const { data, loading, error, refetch } = useQuery<{
    systemAlertSettings: Settings;
  }>(QUERY, {
    client,
    fetchPolicy: 'network-only',
    pollInterval: 15_000,
    skipPollAttempt: () => document.visibilityState !== 'visible',
  });
  const [update, { loading: saving }] = useMutation(UPDATE, { client });
  const [test, { loading: requesting }] = useMutation(TEST, { client });
  const [draft, setDraft] = useState<string[] | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const settings = data?.systemAlertSettings;
  const recipients = draft ?? settings?.recipients ?? [];
  const busy = saving || requesting;
  const ready = settings?.monitorRunning && settings?.mailConfigured;

  const add = () => {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) {
      setMessage(t`올바른 이메일 주소를 입력해 주세요.`);
      setFailed(true);
      return;
    }
    if (recipients.length >= 20) {
      setMessage(t`수신자는 최대 20명까지 등록할 수 있습니다.`);
      setFailed(true);
      return;
    }
    setDraft([...new Set([...recipients, value])]);
    setEmail('');
    setMessage('');
    setFailed(false);
  };
  const save = async (enabled: boolean) => {
    try {
      await update({ variables: { input: { enabled, recipients } } });
      await refetch();
      setDraft(null);
      setMessage(t`알림 설정을 저장했습니다.`);
      setFailed(false);
    } catch {
      setMessage(
        t`저장하지 못했습니다. 이메일 주소와 감시·SMTP 상태를 확인해 주세요.`,
      );
      setFailed(true);
    }
  };
  const sendTest = async () => {
    try {
      await test();
      setFailed(false);
      setMessage(
        t`테스트 발송을 요청했습니다. 1분 이내 처리되며 발송 결과를 아래에서 확인할 수 있습니다.`,
      );
      await refetch();
    } catch {
      setMessage(
        t`테스트를 요청하지 못했습니다. 수신자와 SMTP 설정을 확인하세요. 재요청은 1분 후 가능합니다.`,
      );
      setFailed(true);
    }
  };

  return (
    <StyledSection aria-label={t`장애 이메일 알림`}>
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>{t`장애 이메일 알림`}</StyledDashboardSectionTitle>
        <Status
          color={settings?.enabled ? (ready ? 'green' : 'red') : 'gray'}
          text={
            settings?.enabled
              ? ready
                ? t`사용 중`
                : t`설정 확인 필요`
              : t`사용 안 함`
          }
        />
      </StyledDashboardSectionHeader>
      {loading && !settings && (
        <StyledDashboardMuted role="status">{t`알림 설정을 불러오는 중입니다.`}</StyledDashboardMuted>
      )}
      {error && (
        <StyledDashboardMuted role="alert">{t`알림 설정을 조회하지 못했습니다.`}</StyledDashboardMuted>
      )}
      {settings && (
        <>
          <StyledDashboardMuted>{t`1분마다 점검 · 연속 2회 이상 감지 시 발송 · 장애별 최초 1회 및 복구 알림`}</StyledDashboardMuted>
          {!settings.monitorRunning && (
            <StyledDashboardMuted role="alert">{t`감시 프로세스가 실행되지 않거나 응답이 오래되었습니다. 알림 발송이 중단된 상태입니다.`}</StyledDashboardMuted>
          )}
          {!settings.mailConfigured && (
            <StyledDashboardMuted role="alert">{t`감시 프로세스의 SMTP 발송 설정이 필요합니다. 수신자를 먼저 저장한 뒤 설정 완료 후 알림을 켜세요.`}</StyledDashboardMuted>
          )}
          {recipients.map((address) => (
            <StyledRow key={address}>
              <StyledAddress>{address}</StyledAddress>
              <Button
                title={t`삭제`}
                ariaLabel={t`${address} 삭제`}
                variant="tertiary"
                size="small"
                disabled={busy}
                onClick={() =>
                  setDraft(recipients.filter((value) => value !== address))
                }
              />
            </StyledRow>
          ))}
          {!recipients.length && (
            <StyledDashboardMuted>{t`등록된 수신자가 없습니다.`}</StyledDashboardMuted>
          )}
          <StyledRow>
            <SettingsTextInput
              instanceId="system-alert-recipient"
              label={t`알림 수신 이메일`}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              onInputEnter={add}
              disabled={busy}
            />
            <Button
              title={t`추가`}
              variant="secondary"
              size="small"
              onClick={add}
              disabled={busy || !email.trim()}
            />
          </StyledRow>
          <StyledRow>
            <Button
              title={t`수신자 저장`}
              variant="primary"
              size="small"
              disabled={busy || draft === null}
              onClick={() =>
                void save(recipients.length > 0 && settings.enabled)
              }
            />
            <Button
              title={settings.enabled ? t`알림 끄기` : t`알림 켜기`}
              variant="secondary"
              size="small"
              disabled={
                busy ||
                draft !== null ||
                (!settings.enabled && (!ready || !recipients.length))
              }
              onClick={() => void save(!settings.enabled)}
            />
            <Button
              title={t`테스트 메일 보내기`}
              variant="secondary"
              size="small"
              disabled={
                busy || draft !== null || !ready || !settings.recipients.length
              }
              onClick={() => void sendTest()}
            />
          </StyledRow>
          {draft !== null && (
            <StyledDashboardMuted>{t`변경한 수신자는 저장 후 적용됩니다.`}</StyledDashboardMuted>
          )}
          {message && (
            <StyledDashboardMuted role={failed ? 'alert' : 'status'}>
              {message}
            </StyledDashboardMuted>
          )}
          {settings.lastError && (
            <StyledDashboardMuted role="alert">
              {settings.lastError}
            </StyledDashboardMuted>
          )}
          {settings.activeIssues.map((issue) => (
            <StyledDashboardMuted key={issue} role="alert">
              {issue}
            </StyledDashboardMuted>
          ))}
          <StyledDashboardMuted>
            {t`최근 점검`} {formatDate(settings.lastCheckedAt)} ·{' '}
            {t`최근 SMTP 접수`} {formatDate(settings.lastSentAt)} ·{' '}
            {t`테스트 발송 완료`} {formatDate(settings.lastTestAt)}
          </StyledDashboardMuted>
          <StyledDashboardMuted>{t`감지 범위: API·DB·Redis·워커 장애, DB 연결 90% 이상, DB·서버 디스크 여유 10% 이하, Redis 한도 90% 이상, API CPU 90% 이상(1코어 기준). 같은 서버 전체가 중단되거나 SMTP가 중단되면 외부 감시가 필요합니다.`}</StyledDashboardMuted>
        </>
      )}
    </StyledSection>
  );
};
