import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptySubTitle,
} from 'twenty-ui/feedback';
import { useMailboxChannels } from '@/mailbox/hooks/useMailboxChannels';
import { useMailboxMessages } from '@/mailbox/hooks/useMailboxMessages';
import { useMailboxFolders } from '@/mailbox/hooks/useMailboxFolders';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { styled } from '@linaria/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Select } from '@/ui/input/components/Select';
import { Button } from 'twenty-ui/input';
import { Avatar } from 'twenty-ui/data-display';
import {
  IconArrowLeft,
  IconFolder,
  IconMail,
  IconRefresh,
  IconSettings,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledMailboxShell = styled.div`
  container-type: inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`;
const StyledMailbox = styled.div`
  background: ${themeCssVariables.background.secondary};
  display: grid;
  flex: 1;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  &[data-empty='true'] {
    flex: 0 1 360px;
    grid-template-columns: minmax(0, 1fr);
  }
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[3]};
  @container (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
    &[data-detail-open='true'] {
      grid-template-columns: minmax(0, 1fr);
      > section {
        display: none;
      }
    }
    &[data-detail-open='false'] > article {
      display: none;
    }
  }
  @container (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    &[data-detail-open='true'] {
      grid-template-rows: minmax(0, 1fr);
    }
  }
`;
const StyledFolderPicker = styled.div`
  flex: 1;
  max-width: 240px;
  min-width: 0;
`;
const StyledPane = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
`;
const StyledDetail = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[6]};
  h2 {
    font-size: ${themeCssVariables.font.size.lg};
    margin-top: 0;
  }
  dl {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
  }
  dt {
    margin-top: ${themeCssVariables.spacing[2]};
  }
  dd {
    margin: 0;
  }
  @container (max-width: 800px) {
    grid-column: 1 / -1;
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }
`;
const StyledItem = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;
  &:hover,
  &[aria-current='true'] {
    background: ${themeCssVariables.color.transparent.blue2};
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const StyledMessageSummary = styled.div`
  min-width: 0;
  width: 100%;
  strong,
  span,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  strong {
    font-weight: ${themeCssVariables.font.weight.medium};
  }
  small,
  span {
    color: ${themeCssVariables.font.color.secondary};
    margin-top: ${themeCssVariables.spacing[1]};
  }
`;
const StyledNotice = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  line-height: 1.7;
  margin-top: ${themeCssVariables.spacing[5]};
  padding-top: ${themeCssVariables.spacing[5]};
  white-space: pre-wrap;
`;
const StyledPagination = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  margin-top: auto;
  padding: ${themeCssVariables.spacing[3]};
`;
const StyledAccountPicker = styled.div`
  max-width: 240px;
  min-width: 0;
  width: 100%;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
  strong {
    color: ${themeCssVariables.font.color.primary};
  }
  p {
    line-height: 1.6;
    margin: 0;
  }
`;
const StyledBack = styled.div`
  display: none;
  margin-bottom: ${themeCssVariables.spacing[4]};
  @container (max-width: 800px) {
    display: block;
  }
`;
const StyledConnectionNotice = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-left: auto;
`;
const StyledMessageList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
`;
const MailboxEmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <StyledEmptyState>
    <AnimatedPlaceholder type="emptyInbox" />
    <AnimatedPlaceholderEmptyTextContainer role="status" aria-live="polite">
      <AnimatedPlaceholderEmptyTitle>{title}</AnimatedPlaceholderEmptyTitle>
      {description && (
        <AnimatedPlaceholderEmptySubTitle>
          {description}
        </AnimatedPlaceholderEmptySubTitle>
      )}
    </AnimatedPlaceholderEmptyTextContainer>
  </StyledEmptyState>
);

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '';

const MailboxContent = ({
  channelId,
  connectionNotice,
}: {
  channelId: string;
  connectionNotice?: string;
}) => {
  const {
    messageFolders,
    error: foldersError,
    refetch: refetchFolders,
  } = useMailboxFolders(channelId);
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder');
  const requestedPage = Number(searchParams.get('page') ?? 0);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 0
      ? requestedPage
      : 0;
  const messageId = searchParams.get('message');
  const setMessageId = (id: string | null) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set('message', id);
      else next.delete('message');
      return next;
    });
  };
  const setPage = (value: number) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', String(value));
      next.delete('message');
      return next;
    });
  };
  const { data, loading, error, refetch } = useMailboxMessages(
    channelId,
    folderId,
    page,
  );
  const messages = data?.myMailboxMessages.messages ?? [];
  const initialLoading = loading && !data;
  const selected = messages.find((message) => message.id === messageId);
  const folder = messageFolders.find((item) => item.id === folderId);
  const selectFolder = (id: string | null) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set('folder', id);
      else next.delete('folder');
      next.delete('page');
      next.delete('message');
      return next;
    });
  };
  return (
    <StyledMailboxShell>
      <StyledHeader>
        <StyledFolderPicker>
          <Select
            dropdownId="mailbox-folder-picker"
            value={folderId ?? ''}
            onChange={(value) => selectFolder(value || null)}
            fullWidth
            withSearchInput
            options={[
              { value: '', label: '전체 메일', Icon: IconMail },
              ...messageFolders.map((item) => ({
                value: item.id,
                label: item.name || '이름 없는 폴더',
                Icon: IconFolder,
              })),
            ]}
          />
        </StyledFolderPicker>
        {connectionNotice && (
          <StyledConnectionNotice role="status">
            <span>{connectionNotice}</span>
            <Button
              title="동기화 설정"
              Icon={IconSettings}
              variant="secondary"
              size="small"
              to="/settings/accounts/emails"
            />
          </StyledConnectionNotice>
        )}
        <Button
          title={loading ? '새로 고치는 중…' : '새로 고침'}
          Icon={IconRefresh}
          size="small"
          disabled={loading}
          onClick={() => {
            void Promise.allSettled([refetch(), refetchFolders()]);
          }}
        />
      </StyledHeader>
      {foldersError && (
        <StyledNotice role="alert">
          폴더를 불러오지 못했습니다. 새로 고침으로 다시 시도해 주세요.
        </StyledNotice>
      )}
      <StyledMailbox
        data-detail-open={!!selected}
        data-empty={messages.length === 0}
      >
        <StyledPane aria-label="메일 목록">
          {folder && !folder.isSynced && (
            <StyledNotice>
              이 폴더의 동기화가 꺼져 있습니다. 계정 설정에서 폴더 동기화를 켜면
              메일을 가져옵니다.
            </StyledNotice>
          )}
          {error && messages.length > 0 && (
            <StyledNotice role="alert">
              새로 고침에 실패했습니다. 마지막으로 조회한 메일을 표시합니다.
            </StyledNotice>
          )}
          <StyledMessageList aria-busy={loading}>
            {initialLoading ? (
              <StyledNotice role="status">메일을 불러오는 중…</StyledNotice>
            ) : error && !messages.length ? (
              <StyledNotice role="alert">
                메일을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해
                주세요.
              </StyledNotice>
            ) : !messages.length ? (
              <MailboxEmptyState
                title={
                  folder && !folder.isSynced
                    ? '이 폴더는 동기화가 꺼져 있어요'
                    : '동기화된 메일이 없어요'
                }
              />
            ) : (
              messages.map((message) => {
                const sender = message.participants.find(
                  (participant) => participant.role.toLowerCase() === 'from',
                );
                return (
                  <StyledItem
                    key={message.id}
                    aria-current={messageId === message.id}
                    onClick={() => setMessageId(message.id)}
                  >
                    <Avatar
                      placeholder={
                        sender?.displayName || sender?.handle || '보낸 사람'
                      }
                      placeholderColorSeed={sender?.handle || message.id}
                      type="rounded"
                      size="md"
                    />
                    <StyledMessageSummary>
                      <strong>{message.subject || '(제목 없음)'}</strong>
                      <span>
                        {sender?.displayName ||
                          sender?.handle ||
                          '보낸 사람 정보 없음'}
                      </span>
                      <small>{formatDate(message.receivedAt)}</small>
                      <span>{message.text?.slice(0, 120)}</span>
                    </StyledMessageSummary>
                  </StyledItem>
                );
              })
            )}
          </StyledMessageList>
          {(messages.length > 0 || page > 0) && (
            <StyledPagination>
              <Button
                title="이전"
                size="small"
                disabled={!page || loading}
                onClick={() => {
                  setPage(page - 1);
                }}
              />
              <span>{page + 1}</span>
              <Button
                title="다음"
                size="small"
                disabled={
                  loading || !!error || !data?.myMailboxMessages.hasMore
                }
                onClick={() => {
                  setPage(page + 1);
                }}
              />
            </StyledPagination>
          )}
        </StyledPane>
        {messages.length > 0 && (
          <StyledDetail aria-label="메일 본문">
            {selected ? (
              <>
                <StyledBack>
                  <Button
                    title="메일 목록으로"
                    Icon={IconArrowLeft}
                    size="small"
                    onClick={() => setMessageId(null)}
                  />
                </StyledBack>
                <h2>{selected.subject || '(제목 없음)'}</h2>
                <dl>
                  {selected.participants.map((participant, index) => (
                    <div
                      key={`${participant.role}-${participant.handle}-${index}`}
                    >
                      <dt>
                        {(
                          {
                            from: '보낸 사람',
                            to: '받는 사람',
                            cc: '참조',
                            bcc: '숨은 참조',
                          } as Record<string, string>
                        )[participant.role.toLowerCase()] ?? participant.role}
                      </dt>
                      <dd>
                        {participant.displayName} {participant.handle}
                      </dd>
                    </div>
                  ))}
                  <dt>날짜</dt>
                  <dd>{formatDate(selected.receivedAt)}</dd>
                </dl>
                <StyledBody>
                  {selected.text || '표시할 본문이 없습니다.'}
                </StyledBody>
              </>
            ) : (
              <MailboxEmptyState title="메일을 선택해 주세요" />
            )}
          </StyledDetail>
        )}
      </StyledMailbox>
    </StyledMailboxShell>
  );
};

export const MailboxPage = () => {
  const navigate = useNavigate();
  const { channels, loading, error, refetch } = useMailboxChannels();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('channel') ?? '';
  const setSelectedId = (id: string) => setSearchParams({ channel: id });
  const channel =
    channels.find((item) => item.id === selectedId) ?? channels.at(0);
  return (
    <PageContainer>
      <PageTitle title="메일함" />
      <PageCardLayout
        header={
          <PageCardHeader
            title="메일함"
            icon={<IconMail size={24} />}
            actionButton={
              <>
                <Button
                  title="뒤로가기"
                  Icon={IconArrowLeft}
                  variant="secondary"
                  size="medium"
                  onClick={() => {
                    if (window.history.state?.idx > 0) {
                      navigate(-1);
                    } else {
                      navigate('/status-board');
                    }
                  }}
                />
                {channel && (
                  <StyledAccountPicker>
                    <Select
                      dropdownId="mailbox-account-picker"
                      value={channel.id}
                      onChange={setSelectedId}
                      fullWidth
                      withSearchInput
                      needIconCheck
                      callToActionButton={{
                        text: '연결 계정 관리',
                        Icon: IconSettings,
                        onClick: () => navigate('/settings/accounts/emails'),
                      }}
                      options={channels.map((item) => ({
                        value: item.id,
                        label: item.handle,
                        Icon: IconMail,
                      }))}
                    />
                  </StyledAccountPicker>
                )}
              </>
            }
          />
        }
      >
        {error ? (
          <StyledNotice role="alert">
            이메일 계정을 불러오지 못했습니다.
            <Button
              title="다시 시도"
              Icon={IconRefresh}
              size="small"
              onClick={() => {
                void refetch().catch(() => undefined);
              }}
            />
          </StyledNotice>
        ) : !channel ? (
          <StyledNotice>
            {loading ? (
              '계정을 불러오는 중…'
            ) : (
              <>
                <MailboxEmptyState title="내 이메일을 연결해 보세요" />
                <Button
                  title="이메일 연결"
                  variant="primary"
                  size="small"
                  to="/settings/accounts/emails"
                />
              </>
            )}
          </StyledNotice>
        ) : (
          <MailboxContent
            key={channel.id}
            channelId={channel.id}
            connectionNotice={
              !channel.isSyncEnabled
                ? '동기화 꺼짐'
                : channel.syncStage === 'PENDING_CONFIGURATION'
                  ? '폴더 선택 필요'
                  : channel.syncStatus === 'FAILED' ||
                      channel.syncStage === 'FAILED'
                    ? '연결 확인 필요'
                    : undefined
            }
          />
        )}
      </PageCardLayout>
    </PageContainer>
  );
};
