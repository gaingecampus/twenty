import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';
import { Button } from 'twenty-ui/input';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { hasAnySoftDeleteFilterOnViewComponentSelector } from '@/object-record/record-filter/states/hasAnySoftDeleteFilterOnView';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useCreateNewIndexRecord } from '@/object-record/record-table/hooks/useCreateNewIndexRecord';
import { isRecordTableCellsNonEditableComponentState } from '@/object-record/record-table/states/isRecordTableCellsNonEditableComponentState';
import { RecordTableActionRow } from '@/object-record/record-table/record-table-row/components/RecordTableActionRow';
import { canCreateRecordsForObjectMetadataItem } from '@/object-record/utils/canCreateRecordsForObjectMetadataItem';
import { useLoadRecordsToVirtualRows } from '@/object-record/record-table/virtualization/hooks/useLoadRecordsToVirtualRows';
import { totalNumberOfRecordsToVirtualizeComponentState } from '@/object-record/record-table/virtualization/states/totalNumberOfRecordsToVirtualizeComponentState';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { t } from '@lingui/core/macro';
import { useCallback, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconPlus } from 'twenty-ui/icon';

const StyledCreateRow = styled.form`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  input {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 4px;
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
  }
`;

export const RecordTableNoRecordGroupAddNew = () => {
  const { objectMetadataItem } = useRecordTableContextOrThrow();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const labelField = getLabelIdentifierFieldMetadataItem(objectMetadataItem);
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  const isRecordTableCellsNonEditable = useAtomComponentStateValue(
    isRecordTableCellsNonEditableComponentState,
  );

  const { createNewIndexRecord } = useCreateNewIndexRecord({
    objectMetadataItem,
    openAfterCreate: false,
  });

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const hasAnySoftDeleteFilterOnView = useAtomComponentSelectorValue(
    hasAnySoftDeleteFilterOnViewComponentSelector,
  );

  const totalNumberOfRecordsToVirtualize = useAtomComponentStateValue(
    totalNumberOfRecordsToVirtualizeComponentState,
  );

  const { loadRecordsToVirtualRows } = useLoadRecordsToVirtualRows();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const handleButtonClick = useCallback(async () => {
    if (isSaving || !title.trim() || !labelField) return;
    setIsSaving(true);
    setError('');
    try {
      const createdRecord = await createNewIndexRecord({
        position: 'last',
        [labelField.name]:
          labelField.type === FieldMetadataType.FULL_NAME
            ? { firstName: title.trim(), lastName: '' }
            : title.trim(),
      });

      upsertRecordsInStore({ partialRecords: [createdRecord] });

      if (isDefined(totalNumberOfRecordsToVirtualize)) {
        loadRecordsToVirtualRows({
          records: [createdRecord],
          startingRealIndex: totalNumberOfRecordsToVirtualize,
        });
      }
      setIsAdding(false);
      setTitle('');
    } catch {
      setError('저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    isSaving,
    labelField,
    createNewIndexRecord,
    upsertRecordsInStore,
    loadRecordsToVirtualRows,
    totalNumberOfRecordsToVirtualize,
  ]);

  if (!isInlineEditEnabled || isRecordTableCellsNonEditable) {
    return null;
  }

  if (hasAnySoftDeleteFilterOnView) {
    return null;
  }

  if (
    !canCreateRecordsForObjectMetadataItem({
      objectPermissions,
      objectMetadataItem,
    })
  ) {
    return null;
  }

  if (isAdding)
    return (
      <StyledCreateRow
        onSubmit={(event) => {
          event.preventDefault();
          void handleButtonClick();
        }}
      >
        <input
          autoFocus
          aria-label="새 항목 제목"
          placeholder="제목 입력"
          value={title}
          disabled={isSaving}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape' && !isSaving) {
              setIsAdding(false);
              setTitle('');
              setError('');
            }
          }}
        />
        <Button
          title="저장"
          size="small"
          type="submit"
          disabled={isSaving || !title.trim()}
        />
        <Button
          title="취소"
          size="small"
          variant="secondary"
          type="button"
          disabled={isSaving}
          onClick={() => {
            setIsAdding(false);
            setTitle('');
            setError('');
          }}
        />
        {error && <span role="alert">{error}</span>}
      </StyledCreateRow>
    );

  return (
    <RecordTableActionRow
      onClick={() => setIsAdding(true)}
      LeftIcon={IconPlus}
      text={t`Add New`}
    />
  );
};
