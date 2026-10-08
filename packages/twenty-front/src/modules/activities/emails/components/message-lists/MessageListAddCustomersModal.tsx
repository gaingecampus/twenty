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
import { Button } from 'twenty-ui/input';
import { ModalHeader, ModalContent, ModalFooter } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type Customer = ObjectRecord & {
  name: { firstName: string; lastName: string };
  emails: { primaryEmail: string };
};
type Member = ObjectRecord & { personId: string };
const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.medium};
    padding: ${themeCssVariables.spacing[2]};
    text-align: left;
  }
`;
const StyledScroll = styled.div`
  max-height: 360px;
  overflow: auto;
`;
const StyledListOption = styled.label`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;
export const MessageListAddCustomersModal = ({
  initialListId,
  customerIds,
  onClose,
  onAdded,
}: {
  initialListId?: string;
  customerIds?: string[];
  onClose: () => void;
  onAdded?: () => Promise<unknown>;
}) => {
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
  const { records, loading, error, hasNextPage, fetchMoreRecords } =
    useFindManyRecords<Customer>({
      objectNameSingular: 'person',
      filter: customerIds
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
      recordGqlFields: { id: true, name: true, emails: true },
      limit: 50,
      fetchPolicy: 'cache-and-network',
    });
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
      and: [{ listId: { eq: listId ?? '' } }, { personId: { in: ids } }],
    },
    skip: !listId || ids.length === 0,
    recordGqlFields: { id: true, personId: true },
    limit: 200,
    fetchPolicy: 'network-only',
  });
  const { canUpdateObjectRecords } = useObjectPermissionsForObject(
    memberMetadata.id,
  );
  const { additions, alreadyIncluded, missingEmail } = getMessageListAdditions(
    candidates,
    existing.map((member) => member.personId),
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
            personId: person.id,
          })),
        });
        added += batch.length;
      }
      await onAdded?.();
      enqueueSuccessSnackBar({
        message: t`고객 ${added}명을 세그먼트에 추가했습니다.`,
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
      <ModalHeader hasBorderBottom>{t`세그먼트에 고객 추가`}</ModalHeader>
      <ModalContent contentPadding={4} gap={3}>
        {!initialListId && (
          <section aria-label={t`추가할 세그먼트`}>
            <TextInput
              placeholder={t`세그먼트 검색`}
              value={listSearch}
              onChange={setListSearch}
              disabled={busy}
            />
            <StyledScroll>
              {lists.map((list) => (
                <StyledListOption key={list.id}>
                  <input
                    type="radio"
                    name={`${modalId}-list`}
                    checked={listId === list.id}
                    onChange={() => setListId(list.id)}
                    disabled={busy}
                  />
                  {list.name || t`제목 없는 목록`}
                </StyledListOption>
              ))}
            </StyledScroll>
            {loadingLists && <p>{t`세그먼트를 불러오는 중입니다.`}</p>}
            {listsError && (
              <p role="alert">{t`세그먼트를 불러오지 못했습니다.`}</p>
            )}
            {!loadingLists && !listsError && lists.length === 0 && (
              <p>{t`선택할 세그먼트가 없습니다.`}</p>
            )}
            {moreLists && (
              <Button
                title={t`목록 더 보기`}
                onClick={() => fetchMoreLists()}
                disabled={busy}
              />
            )}
          </section>
        )}
        {!customerIds && (
          <TextInput
            placeholder={t`고객 이름 또는 이메일 검색`}
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
                <th>
                  {!customerIds && (
                    <input
                      type="checkbox"
                      aria-label={t`현재 표시된 고객 모두 선택`}
                      disabled={busy || records.length === 0}
                      checked={
                        records.length > 0 &&
                        records.every((person) => selected.has(person.id))
                      }
                      onChange={(event) => {
                        const checked = event.target.checked;
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
                  )}
                </th>
                <th>{t`고객`}</th>
                <th>{t`이메일`}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((person) => (
                <tr key={person.id}>
                  <td>
                    {!customerIds && (
                      <input
                        type="checkbox"
                        aria-label={[
                          person.name?.firstName,
                          person.name?.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        checked={selected.has(person.id)}
                        disabled={busy}
                        onChange={() => toggle(person)}
                      />
                    )}
                  </td>
                  <td>
                    {[person.name?.firstName, person.name?.lastName]
                      .filter(Boolean)
                      .join(' ')}
                  </td>
                  <td>{person.emails?.primaryEmail || t`이메일 없음`}</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </StyledScroll>
        {loading && <p>{t`불러오는 중…`}</p>}
        {error && <p role="alert">{t`고객을 불러오지 못했습니다.`}</p>}
        {!loading && !error && records.length === 0 && (
          <p>{t`검색 결과가 없습니다.`}</p>
        )}
        {hasNextPage && (
          <Button
            title={t`고객 더 보기`}
            disabled={loading || busy}
            onClick={() => fetchMoreRecords()}
          />
        )}
        <p>{t`선택 ${candidates.length}명 · 이미 포함 ${alreadyIncluded}명 · 새로 추가 ${additions.length}명 · 이메일 없음 ${missingEmail}명`}</p>
        <p>{t`이미 포함된 고객은 건너뜁니다. 이메일이 없는 고객도 목록에는 저장되지만 발송할 때 제외됩니다.`}</p>
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
      </ModalContent>
      <ModalFooter>
        <Button title={t`취소`} disabled={busy} onClick={onClose} />
        <Button
          title={t`선택 고객 추가`}
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
