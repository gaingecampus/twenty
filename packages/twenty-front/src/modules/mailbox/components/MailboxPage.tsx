import { useMailboxChannels } from '@/mailbox/hooks/useMailboxChannels';
import { useMailboxMessages } from '@/mailbox/hooks/useMailboxMessages';
import { useMyMessageFolders } from '@/settings/accounts/hooks/useMyMessageFolders';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'twenty-ui/input';
import { IconFolder, IconMail, IconRefresh } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
  h1 {
    font-size: ${themeCssVariables.font.size.lg};
    margin: 0;
  }
  select {
    background: ${themeCssVariables.background.primary};
    color: ${themeCssVariables.font.color.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    padding: ${themeCssVariables.spacing[2]};
    max-width: 100%;
  }
`;
const StyledMailbox = styled.div`
  display: grid;
  flex: 1;
  grid-template-columns: 190px minmax(260px, 340px) minmax(260px, 1fr);
  min-height: 0;
  overflow: auto;
  @media (max-width: 1000px) {
    grid-template-columns: 150px minmax(240px, 1fr);
  }
`;
const StyledPane = styled.section`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  overflow: auto;
  min-width: 0;
`;
const StyledDetail = styled.article`
  padding: ${themeCssVariables.spacing[6]};
  overflow: auto;
  overflow-wrap: anywhere;
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
  @media (max-width: 1000px) {
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
  gap: ${themeCssVariables.spacing[2]};
  font: inherit;
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;
  &:hover,
  &[aria-current='true'] {
    background: ${themeCssVariables.background.tertiary};
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
  padding: ${themeCssVariables.spacing[4]};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;
const StyledBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  margin-top: ${themeCssVariables.spacing[5]};
  padding-top: ${themeCssVariables.spacing[5]};
  line-height: 1.7;
  white-space: pre-wrap;
`;
const StyledPagination = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledLayout = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '';

const MailboxContent = ({ channelId }: { channelId: string }) => {
  const {
    messageFolders,
    loading: foldersLoading,
    error: foldersError,
  } = useMyMessageFolders(channelId);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [messageId, setMessageId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useMailboxMessages(
    channelId,
    folderId,
    page,
  );
  const messages =
    loading || error ? [] : (data?.myMailboxMessages.messages ?? []);
  const selected = messages.find((message) => message.id === messageId);
  const folder = messageFolders.find((item) => item.id === folderId);
  const selectFolder = (id: string | null) => {
    setFolderId(id);
    setPage(0);
    setMessageId(null);
  };
  return (
    <StyledMailbox>
      <StyledPane aria-label="메일 폴더">
        <StyledItem
          aria-current={folderId === null}
          onClick={() => selectFolder(null)}
        >
          <IconMail size={16} />
          전체 메일
        </StyledItem>
        {foldersLoading && <StyledNotice>폴더를 불러오는 중…</StyledNotice>}
        {foldersError && (
          <StyledNotice role="alert">
            폴더를 불러오지 못했습니다. 새로 고침해 주세요.
          </StyledNotice>
        )}
        {messageFolders.map((item) => (
          <StyledItem
            key={item.id}
            aria-current={folderId === item.id}
            onClick={() => selectFolder(item.id)}
            title={item.name}
          >
            <IconFolder size={16} />
            <span>{item.name || '이름 없는 폴더'}</span>
          </StyledItem>
        ))}
        <StyledNotice>
          연결한 계정에서 동기화한 메일입니다.
          <br />
          <Link to="/settings/accounts/emails">계정·동기화 설정</Link>
        </StyledNotice>
      </StyledPane>
      <StyledPane aria-label="메일 목록">
        <StyledHeader>
          <strong>{folder?.name ?? '전체 메일'}</strong>
          <Button
            title="새로 고침"
            Icon={IconRefresh}
            size="small"
            disabled={loading}
            onClick={() => {
              void refetch();
            }}
          />
        </StyledHeader>
        {folder && !folder.isSynced && (
          <StyledNotice>
            이 폴더의 동기화가 꺼져 있습니다. 계정 설정에서 폴더 동기화를 켜면
            메일을 가져옵니다.
          </StyledNotice>
        )}
        {loading ? (
          <StyledNotice>메일을 불러오는 중…</StyledNotice>
        ) : error ? (
          <StyledNotice role="alert">
            메일을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.
          </StyledNotice>
        ) : !messages.length ? (
          <StyledNotice>동기화된 메일이 없습니다.</StyledNotice>
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
        <StyledPagination>
          <Button
            title="이전"
            size="small"
            disabled={!page || loading}
            onClick={() => {
              setPage(page - 1);
              setMessageId(null);
            }}
          />
          <span>{page + 1}</span>
          <Button
            title="다음"
            size="small"
            disabled={loading || !!error || !data?.myMailboxMessages.hasMore}
            onClick={() => {
              setPage(page + 1);
              setMessageId(null);
            }}
          />
        </StyledPagination>
      </StyledPane>
      <StyledDetail aria-label="메일 본문">
        {selected ? (
          <>
            <h2>{selected.subject || '(제목 없음)'}</h2>
            <dl>
              {selected.participants.map((participant, index) => (
                <div key={`${participant.role}-${participant.handle}-${index}`}>
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
          <StyledNotice>목록에서 메일을 선택하세요.</StyledNotice>
        )}
      </StyledDetail>
    </StyledMailbox>
  );
};

export const MailboxPage = () => {
  const { channels, loading, error } = useMailboxChannels();
  const [selectedId, setSelectedId] = useState('');
  const channel =
    channels.find((item) => item.id === selectedId) ?? channels[0];
  return (
    <PageContainer>
      <StyledLayout>
        <StyledHeader>
          <IconMail size={20} />
          <h1>이메일</h1>
          {channel && (
            <select
              aria-label="이메일 계정"
              value={channel.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {channels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.handle}
                </option>
              ))}
            </select>
          )}
        </StyledHeader>
        {error ? (
          <StyledNotice role="alert">
            이메일 계정을 불러오지 못했습니다. 새로 고침해 주세요.
          </StyledNotice>
        ) : !channel ? (
          <StyledNotice>
            {loading ? (
              '계정을 불러오는 중…'
            ) : (
              <>
                연결한 이메일 계정이 없습니다.{' '}
                <Link to="/settings/accounts/emails">이메일 연결하기</Link>
              </>
            )}
          </StyledNotice>
        ) : (
          <>
            {(!channel.isSyncEnabled ||
              channel.syncStatus === 'FAILED' ||
              channel.syncStage === 'PENDING_CONFIGURATION' ||
              channel.syncStage === 'FAILED') && (
              <StyledNotice>
                메일 동기화가 중지되었거나 설정이 필요합니다.{' '}
                <Link to="/settings/accounts/emails">연결 상태 확인</Link>
              </StyledNotice>
            )}
            <MailboxContent key={channel.id} channelId={channel.id} />
          </>
        )}
      </StyledLayout>
    </PageContainer>
  );
};
