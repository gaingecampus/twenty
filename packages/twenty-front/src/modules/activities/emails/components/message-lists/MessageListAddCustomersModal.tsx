import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyTitle,
  AnimatedPlaceholderEmptyTextContainer,
} from 'twenty-ui/feedback';
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
import { IconInfoCircle, IconX, IconUsers } from 'twenty-ui/icon';
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
    width: 32px;
  }
  tbody tr[data-selected='true'] {
    background: ${themeCssVariables.color.transparent.blue2};
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
`;
const StyledScroll = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  flex-shrink: 0;
  overflow: visible;
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
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
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
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
`;
const StyledIntro = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
`;
const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  > :first-child {
    flex: 1;
    min-width: 160px;
  }
`;
const StyledEmpty = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
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
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-height: calc(85dvh - 180px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[5]};
`;
const StyledInfo = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;
const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;
const StyledFooterHint = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
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
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const {
    records: lists,
    loading: loadingLists,
    error: listsError,
    hasNextPage: moreLists,
    fetchMoreRecords: fetchMoreLists,
  } = useFindManyRecords<ObjectRecord & { name: string }>({
    objectNameSingular: 'messageList',
    filter: initialListId
      ? { id: { eq: initialListId } }
      : listSearch.trim()
        ? { name: { ilike: `%${listSearch.trim()}%` } }
        : undefined,
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
  const [preparationError, setPreparationError] = useState(false);
  const [pendingPage, setPendingPage] = useState(false);
  const candidates = customerIds ? records : Array.from(selected.values());
  const visibleRecords = !customerIds && selectedOnly ? candidates : records;
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
  useEffect(() => {
    if (pendingPage || preparationError || busy || error || checkError) return;
    const loadMore =
      customerIds && hasNextPage && !loading
        ? fetchMoreRecords
        : moreExisting && !checking
          ? fetchMoreExisting
          : undefined;
    if (!loadMore) return;
    setPendingPage(true);
    void loadMore()
      .catch(() => setPreparationError(true))
      .finally(() => {
        setPendingPage(false);
      });
  }, [
    pendingPage,
    customerIds,
    hasNextPage,
    loading,
    moreExisting,
    checking,
    fetchMoreRecords,
    fetchMoreExisting,
    preparationError,
    busy,
    error,
    checkError,
  ]);
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
      loading ||
      error ||
      pendingPage ||
      preparationError ||
      (customerIds && hasNextPage) ||
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
            {isWorkspaceMember ? t`멤버 추가` : t`고객 추가`}
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
        {initialListId && (
          <StyledIntro>
            <IconUsers size={18} aria-hidden />
            <StyledTitle>{lists[0]?.name || '동반 고객 목록'}</StyledTitle>
          </StyledIntro>
        )}
        {!initialListId && (
          <StyledSection aria-label={t`추가할 동반 고객 목록`}>
            <StyledTitle>{t`1. 동반 고객 목록 선택`}</StyledTitle>
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
                disabled={busy || loadingLists}
              />
            )}
          </StyledSection>
        )}
        <StyledSection aria-label={t`추가할 수신자`}>
          <StyledSectionHeader>
            <StyledTitle>
              {isWorkspaceMember
                ? t`워크스페이스 멤버 (본인 제외)`
                : initialListId
                  ? t`추가할 고객 선택`
                  : t`2. 추가할 고객 확인`}
            </StyledTitle>
            {!customerIds && selected.size > 0 && (
              <Button
                title={t`선택 해제 (${selected.size}명)`}
                size="small"
                variant="tertiary"
                disabled={busy}
                onClick={() => setSelected(new Map())}
              />
            )}
          </StyledSectionHeader>
          {!customerIds && (
            <StyledToolbar>
              <TextInput
                placeholder={t`이름 또는 이메일 검색`}
                value={search}
                onChange={(value) => {
                  setSelectedOnly(false);
                  setSearch(value);
                }}
                fullWidth
                disabled={busy}
              />
              <Button
                title={selectedOnly ? t`전체 보기` : t`선택 ${selected.size}명`}
                size="small"
                variant={selectedOnly ? 'secondary' : 'tertiary'}
                disabled={busy}
                onClick={() => setSelectedOnly(!selectedOnly)}
              />
            </StyledToolbar>
          )}
          <StyledScroll>
            <StyledTable>
              <thead>
                <tr>
                  {!customerIds && (
                    <th data-selection>
                      <Checkbox
                        aria-label={t`현재 표시된 수신자 모두 선택`}
                        disabled={busy || visibleRecords.length === 0}
                        checked={
                          visibleRecords.length > 0 &&
                          visibleRecords.every((person) =>
                            selected.has(person.id),
                          )
                        }
                        indeterminate={
                          visibleRecords.some((person) =>
                            selected.has(person.id),
                          ) &&
                          !visibleRecords.every((person) =>
                            selected.has(person.id),
                          )
                        }
                        onCheckedChange={(checked) => {
                          setSelected((previous) => {
                            const next = new Map(previous);
                            visibleRecords.forEach((person) => {
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
                  <th>{t`이메일 · 상태`}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((person) => (
                  <tr
                    key={person.id}
                    data-selected={!!customerIds || selected.has(person.id)}
                  >
                    {!customerIds && (
                      <td data-selection>
                        <Checkbox
                          aria-label={
                            [person.name?.firstName, person.name?.lastName]
                              .filter(Boolean)
                              .join(' ') || t`이름 없는 고객 선택`
                          }
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
                    <td>
                      {person.emails?.primaryEmail ||
                        person.userEmail ||
                        t`이메일 없음`}
                      {existing.some(
                        (member) => member[recipientIdField] === person.id,
                      ) && <StyledHint>이미 목록에 있음</StyledHint>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </StyledScroll>
          {loading && <p>{t`불러오는 중…`}</p>}
          {error && <p role="alert">{t`수신자를 불러오지 못했습니다.`}</p>}
          {!loading && !error && visibleRecords.length === 0 && (
            <StyledEmpty>
              <AnimatedPlaceholder type="noMatchRecord" />
              <AnimatedPlaceholderEmptyTextContainer role="status">
                <AnimatedPlaceholderEmptyTitle>
                  {selectedOnly
                    ? t`선택한 고객이 없어요`
                    : t`검색 결과가 없어요`}
                </AnimatedPlaceholderEmptyTitle>
              </AnimatedPlaceholderEmptyTextContainer>
            </StyledEmpty>
          )}
          {hasNextPage && !customerIds && !selectedOnly && (
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
            {t`추가 안내`}
          </StyledInfo>
          <AppTooltip
            anchorSelect={`[data-recipient-info="${modalId}"]`}
            content={t`목록에만 추가하며 메시지는 발송하지 않습니다. 중복 고객은 건너뛰고, 이메일이 없는 고객은 발송 시 제외됩니다.`}
          />
        </StyledHint>
        {checkError && (
          <p role="alert">{t`기존 수신자를 확인하지 못했습니다.`}</p>
        )}
        {(checkError || preparationError) && (
          <Button
            title="다시 확인"
            onClick={() => {
              setPreparationError(false);
              void refetch().catch(() => setPreparationError(true));
            }}
          />
        )}
      </StyledBody>
      <ModalFooter autoHeight>
        <StyledFooterHint role="status">
          {!canUpdateObjectRecords
            ? t`목록을 수정할 권한이 없습니다.`
            : !listId
              ? t`추가할 목록을 먼저 선택하세요.`
              : checking || moreExisting || Boolean(customerIds && hasNextPage)
                ? t`이미 포함된 고객을 확인하고 있습니다.`
                : checkError || preparationError
                  ? t`중복 확인에 실패했습니다.`
                  : candidates.length === 0
                    ? t`추가할 고객을 선택하세요.`
                    : additions.length === 0
                      ? t`선택한 고객이 모두 목록에 포함되어 있습니다.`
                      : t`선택 ${candidates.length}명 · 이미 포함 ${alreadyIncluded}명 · 추가 ${additions.length}명 · 이메일 없음 ${missingEmail}명`}
        </StyledFooterHint>
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
            preparationError ||
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
