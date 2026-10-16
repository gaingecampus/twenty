import { allowRequestsToTwentyIconsState } from '@/client-config/states/allowRequestsToTwentyIcons';
import { getLogoUrlFromDomainName } from 'twenty-shared/utils';
import { getWorkspaceMemberRecipients } from '@/activities/emails/utils/getWorkspaceMemberRecipients';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getMessageListAdditions } from '@/activities/emails/utils/getMessageListAdditions';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useCreateManyRecords } from '@/object-record/hooks/useCreateManyRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { TextInput } from '@/ui/input/components/TextInput';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useEffect, useId, useState } from 'react';
import { Avatar } from 'twenty-ui/data-display';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { IconInfoCircle, IconX } from 'twenty-ui/icon';
import { Button, Checkbox, Radio } from 'twenty-ui/input';
import { AppTooltip, ModalHeader, ModalFooter } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type Customer = ObjectRecord & {
  name: { firstName: string; lastName: string };
  emails: { primaryEmail: string };
  userEmail?: string;
  avatarUrl?: string;
  avatarFile?: { url: string }[];
  jobTitle?: string;
  company?: {
    id: string;
    name: string;
    domainName?: { primaryLinkUrl?: string };
  } | null;
};
type Member = ObjectRecord & { personId: string; workspaceMemberId: string };
const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: ${themeCssVariables.font.size.sm};
  table-layout: fixed;
  width: 100%;
  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    overflow-wrap: anywhere;
    padding: ${themeCssVariables.spacing[3]};
    text-align: left;
  }
  th {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.secondary};
    font-weight: ${themeCssVariables.font.weight.medium};
    position: sticky;
    top: 0;
    z-index: 1;
  }
  th[data-selection],
  td[data-selection] {
    width: 20px;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
`;
const StyledScroll = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  flex-shrink: 0;
  max-height: 200px;
  overflow: auto;
  overscroll-behavior: contain;
`;
const StyledCustomerProfile = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  > :first-child {
    flex-shrink: 0;
  }
`;
const StyledCustomerDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  min-width: 0;
`;
const StyledCustomerContext = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;
const StyledListOption = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  > :last-child {
    flex: 1;
    min-width: 0;
  }
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${themeCssVariables.background.secondary};
  }
  &[data-selected='true'] {
    background: ${themeCssVariables.color.transparent.blue2};
    box-shadow: inset 3px 0 ${themeCssVariables.color.blue};
  }
  label {
    cursor: pointer;
    flex: 1;
  }
`;
const StyledSection = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;
const StyledHeaderTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;
const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  width: 100%;
`;
const StyledBody = styled.div`
  background: ${themeCssVariables.background.secondary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-height: calc(85dvh - 180px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[5]};
`;
const StyledSummary = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const StyledMetric = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[3]};
  dt {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
    margin-bottom: ${themeCssVariables.spacing[2]};
  }
  dd {
    font-size: ${themeCssVariables.font.size.xl};
    font-weight: ${themeCssVariables.font.weight.semiBold};
    margin: 0;
  }
  &[data-accent='blue'] dd {
    color: ${themeCssVariables.color.blue};
  }
`;
const StyledInfo = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin: 0;
`;
export const MessageListAddCustomersModal = ({
  initialListId,
  recipientType = 'person',
  customerIds,
  onClose,
  onAdded,
}: {
  initialListId?: string;
  recipientType?: 'person' | 'workspaceMember';
  customerIds?: string[];
  onClose: () => void;
  onAdded?: () => Promise<unknown>;
}) => {
  const allowRequestsToTwentyIcons = useAtomStateValue(
    allowRequestsToTwentyIconsState,
  );
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const isWorkspaceMember = recipientType === 'workspaceMember';
  const recipientIdField = isWorkspaceMember ? 'workspaceMemberId' : 'personId';
  const modalId = useId();
  const { openModal, closeModal } = useModal();
  useEffect(() => {
    openModal(modalId);
    return () => closeModal(modalId);
  }, [openModal, closeModal, modalId]);
  const [listId, setListId] = useState<string | null>(initialListId ?? null);
  const [search, setSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const {
    records: lists,
    loading: loadingLists,
    error: listsError,
    hasNextPage: moreLists,
    fetchMoreRecords: fetchMoreLists,
  } = useFindManyRecords<ObjectRecord & { name: string }>({
    objectNameSingular: 'messageList',
    filter: listSearch.trim()
      ? { name: { ilike: `%${listSearch.trim()}%` } }
      : undefined,
    skip: !!initialListId,
    recordGqlFields: { id: true, name: true },
    limit: 50,
  });
  const [selected, setSelected] = useState<Map<string, Customer>>(new Map());
  const [busy, setBusy] = useState(false);
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const {
    records: rawRecords,
    loading,
    error,
    hasNextPage,
    fetchMoreRecords,
  } = useFindManyRecords<Customer>({
    objectNameSingular: recipientType,
    skip: isWorkspaceMember && !currentWorkspaceMember?.id,
    filter: isWorkspaceMember
      ? {
          and: [
            { id: { neq: currentWorkspaceMember?.id ?? '' } },
            ...(search.trim()
              ? [
                  {
                    or: [
                      { name: { firstName: { ilike: `%${search.trim()}%` } } },
                      { name: { lastName: { ilike: `%${search.trim()}%` } } },
                      { userEmail: { ilike: `%${search.trim()}%` } },
                    ],
                  },
                ]
              : []),
          ],
        }
      : customerIds
        ? { id: { in: customerIds } }
        : search.trim()
          ? {
              or: [
                { name: { firstName: { ilike: `%${search.trim()}%` } } },
                { name: { lastName: { ilike: `%${search.trim()}%` } } },
                { emails: { primaryEmail: { ilike: `%${search.trim()}%` } } },
              ],
            }
          : undefined,
    recordGqlFields: isWorkspaceMember
      ? { id: true, name: true, userEmail: true, avatarUrl: true }
      : {
          id: true,
          name: true,
          emails: true,
          avatarFile: true,
          jobTitle: true,
          company: { id: true, name: true, domainName: true },
        },
    limit: 50,
    fetchPolicy: 'cache-and-network',
  });
  const records = isWorkspaceMember
    ? getWorkspaceMemberRecipients(rawRecords, currentWorkspaceMember?.id)
    : rawRecords;
  const candidates = customerIds ? records : Array.from(selected.values());
  const ids = candidates.map((person) => person.id);
  const {
    objectMetadataItem: memberMetadata,
    records: existing,
    loading: checking,
    error: checkError,
    hasNextPage: moreExisting,
    fetchMoreRecords: fetchMoreExisting,
    refetch,
  } = useFindManyRecords<Member>({
    objectNameSingular: 'messageListMember',
    filter: {
      and: [
        { listId: { eq: listId ?? '' } },
        { [recipientIdField]: { in: ids } },
      ],
    },
    skip: !listId || ids.length === 0,
    recordGqlFields: { id: true, [recipientIdField]: true },
    limit: 200,
    fetchPolicy: 'network-only',
  });
  const { canUpdateObjectRecords } = useObjectPermissionsForObject(
    memberMetadata.id,
  );
  const { additions, alreadyIncluded, missingEmail } = getMessageListAdditions(
    candidates,
    existing.map((member) => member[recipientIdField]),
  );
  const { createManyRecords } = useCreateManyRecords({
    objectNameSingular: 'messageListMember',
  });
  const toggle = (person: Customer) =>
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(person.id)) next.delete(person.id);
      else next.set(person.id, person);
      return next;
    });
  const confirm = async () => {
    if (
      !canUpdateObjectRecords ||
      !listId ||
      additions.length === 0 ||
      busy ||
      checking ||
      moreExisting ||
      checkError
    )
      return;
    setBusy(true);
    let added = 0;
    try {
      for (let offset = 0; offset < additions.length; offset += 100) {
        const batch = additions.slice(offset, offset + 100);
        await createManyRecords({
          recordsToCreate: batch.map((person) => ({
            listId,
            [recipientIdField]: person.id,
          })),
        });
        added += batch.length;
      }
      await onAdded?.();
      enqueueSuccessSnackBar({
        message: t`수신자 ${added}명을 동반 고객 목록에 추가했습니다.`,
      });
      onClose();
    } catch {
      await refetch();
      await onAdded?.();
      enqueueErrorSnackBar({
        message: t`${added}명 추가 완료. 나머지는 추가하지 못했습니다. 중복 확인 후 다시 시도하세요.`,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalStatefulWrapper
      modalInstanceId={modalId}
      size="large"
      padding="none"
      gap={0}
      isClosable
      onClose={() => {
        if (!busy) onClose();
      }}
      shouldCloseModalOnClickOutsideOrEscape={!busy}
      renderInDocumentBody
    >
      <ModalHeader hasBorderBottom autoHeight>
        <StyledHeader>
          <StyledHeaderTitle>
            {isWorkspaceMember
              ? t`동반 고객 목록에 워크스페이스 멤버 추가`
              : t`동반 고객 목록에 고객 추가`}
          </StyledHeaderTitle>
          <Button
            Icon={IconX}
            ariaLabel={t`닫기`}
            variant="tertiary"
            disabled={busy}
            onClick={onClose}
          />
        </StyledHeader>
      </ModalHeader>
      <StyledBody>
        <StyledSummary aria-label={t`수신자 추가 요약`} aria-live="polite">
          <StyledMetric>
            <dt>{t`선택한 수신자`}</dt>
            <dd>
              {candidates.length}
              {t`명`}
            </dd>
          </StyledMetric>
          <StyledMetric>
            <dt>{t`이미 포함`}</dt>
            <dd>
              {listId && !checking && !moreExisting && !checkError
                ? `${alreadyIncluded}명`
                : '—'}
            </dd>
          </StyledMetric>
          <StyledMetric data-accent="blue">
            <dt>{t`추가 예정`}</dt>
            <dd>
              {listId && !checking && !moreExisting && !checkError
                ? `${additions.length}명`
                : '—'}
            </dd>
          </StyledMetric>
          <StyledMetric>
            <dt>{t`이메일 없음`}</dt>
            <dd>
              {missingEmail}
              {t`명`}
            </dd>
          </StyledMetric>
        </StyledSummary>
        {!initialListId && (
          <StyledSection aria-label={t`추가할 동반 고객 목록`}>
            <StyledTitle>{t`동반 고객 목록 선택`}</StyledTitle>
            <TextInput
              placeholder={t`동반 고객 목록 검색`}
              fullWidth
              value={listSearch}
              onChange={setListSearch}
              disabled={busy}
            />
            <StyledScroll>
              {lists.map((list) => (
                <StyledListOption
                  key={list.id}
                  data-selected={listId === list.id}
                >
                  <Avatar
                    placeholder={list.name || t`제목 없는 목록`}
                    placeholderColorSeed={list.id}
                    type="squared"
                    size="md"
                  />
                  <Radio
                    label={list.name || t`제목 없는 목록`}
                    name={`${modalId}-list`}
                    checked={listId === list.id}
                    onCheckedChange={() => setListId(list.id)}
                    disabled={busy}
                  />
                </StyledListOption>
              ))}
            </StyledScroll>
            {loadingLists && <p>{t`동반 고객 목록을 불러오는 중입니다.`}</p>}
            {listsError && (
              <p role="alert">{t`동반 고객 목록을 불러오지 못했습니다.`}</p>
            )}
            {!loadingLists && !listsError && lists.length === 0 && (
              <p>{t`선택할 동반 고객 목록이 없습니다.`}</p>
            )}
            {moreLists && (
              <Button
                title={t`목록 더 보기`}
                onClick={() => fetchMoreLists()}
                disabled={busy}
              />
            )}
          </StyledSection>
        )}
        <StyledSection aria-label={t`추가할 수신자`}>
          <StyledTitle>
            {isWorkspaceMember
              ? t`워크스페이스 멤버 (본인 제외)`
              : t`추가할 고객`}
          </StyledTitle>
          {!customerIds && (
            <TextInput
              placeholder={t`이름 또는 이메일 검색`}
              value={search}
              onChange={setSearch}
              fullWidth
              disabled={busy}
            />
          )}
          <StyledScroll>
            <StyledTable>
              <thead>
                <tr>
                  {!customerIds && (
                    <th data-selection>
                      <Checkbox
                        aria-label={t`현재 표시된 수신자 모두 선택`}
                        disabled={busy || records.length === 0}
                        checked={
                          records.length > 0 &&
                          records.every((person) => selected.has(person.id))
                        }
                        onCheckedChange={(checked) => {
                          setSelected((previous) => {
                            const next = new Map(previous);
                            records.forEach((person) => {
                              if (checked) next.set(person.id, person);
                              else next.delete(person.id);
                            });
                            return next;
                          });
                        }}
                      />
                    </th>
                  )}
                  <th>{t`이름`}</th>
                  <th>{t`이메일`}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((person) => (
                  <tr key={person.id}>
                    {!customerIds && (
                      <td data-selection>
                        <Checkbox
                          aria-label={[
                            person.name?.firstName,
                            person.name?.lastName,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          checked={selected.has(person.id)}
                          disabled={busy}
                          onCheckedChange={() => toggle(person)}
                        />
                      </td>
                    )}
                    <td>
                      <StyledCustomerProfile>
                        <Avatar
                          avatarUrl={getAbsoluteImageUrl(
                            isWorkspaceMember
                              ? person.avatarUrl
                              : person.avatarFile?.[0]?.url,
                          )}
                          placeholder={[
                            person.name?.firstName,
                            person.name?.lastName,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          placeholderColorSeed={person.id}
                          type="rounded"
                          size="md"
                        />
                        <StyledCustomerDetails>
                          <span>
                            {[person.name?.firstName, person.name?.lastName]
                              .filter(Boolean)
                              .join(' ') || t`이름 없음`}
                          </span>
                          {!isWorkspaceMember &&
                            (person.company?.name || person.jobTitle) && (
                              <StyledCustomerContext>
                                {person.company?.name && (
                                  <>
                                    <Avatar
                                      avatarUrl={
                                        allowRequestsToTwentyIcons &&
                                        person.company.domainName
                                          ?.primaryLinkUrl
                                          ? getLogoUrlFromDomainName(
                                              person.company.domainName
                                                .primaryLinkUrl,
                                            )
                                          : undefined
                                      }
                                      placeholder={person.company.name}
                                      placeholderColorSeed={person.company.id}
                                      type="squared"
                                      size="sm"
                                    />
                                    <span>{person.company.name}</span>
                                  </>
                                )}
                                {person.company?.name &&
                                  person.jobTitle &&
                                  ' · '}
                                {person.jobTitle}
                              </StyledCustomerContext>
                            )}
                        </StyledCustomerDetails>
                      </StyledCustomerProfile>
                    </td>
                    <td>{person.emails?.primaryEmail || t`이메일 없음`}</td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledScroll>
          {loading && <p>{t`불러오는 중…`}</p>}
          {error && <p role="alert">{t`수신자를 불러오지 못했습니다.`}</p>}
          {!loading && !error && records.length === 0 && (
            <p>{t`검색 결과가 없습니다.`}</p>
          )}
          {hasNextPage && (
            <Button
              title={t`수신자 더 보기`}
              disabled={loading || busy}
              onClick={() => fetchMoreRecords()}
            />
          )}
        </StyledSection>
        <StyledHint>
          <StyledInfo
            tabIndex={0}
            data-recipient-info={modalId}
            aria-label={t`수신자 추가 안내: 중복 수신자는 건너뛰며 이메일 없는 수신자는 발송 시 제외됩니다.`}
          >
            <IconInfoCircle size={16} aria-hidden />
            {t`중복 수신자는 자동으로 제외됩니다.`}
          </StyledInfo>
          <AppTooltip
            anchorSelect={`[data-recipient-info="${modalId}"]`}
            content={t`이미 포함된 수신자는 건너뜁니다. 이메일이 없는 수신자도 목록에는 저장되지만 발송할 때 제외됩니다.`}
          />
        </StyledHint>
        {checkError && (
          <p role="alert">{t`기존 수신자를 확인하지 못했습니다.`}</p>
        )}
        {moreExisting && (
          <Button
            title={t`중복 확인 계속`}
            disabled={checking}
            onClick={() => fetchMoreExisting()}
          />
        )}
      </StyledBody>
      <ModalFooter autoHeight>
        <Button title={t`취소`} disabled={busy} onClick={onClose} />
        <Button
          title={
            busy
              ? t`추가 중…`
              : listId &&
                  !checking &&
                  !moreExisting &&
                  !checkError &&
                  additions.length > 0
                ? t`${additions.length}명 추가`
                : t`수신자 추가`
          }
          variant="primary"
          accent="blue"
          disabled={
            !canUpdateObjectRecords ||
            busy ||
            loading ||
            checking ||
            Boolean(error) ||
            Boolean(checkError) ||
            moreExisting ||
            !listId ||
            additions.length === 0 ||
            Boolean(customerIds && hasNextPage)
          }
          onClick={confirm}
        />
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
