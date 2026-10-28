import { RecordTitleCellContainerType } from '@/object-record/record-title-cell/types/RecordTitleCellContainerType';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useFullNameFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/useFullNameFieldDisplay';
import { useRecordTitleCell } from '@/object-record/record-title-cell/hooks/useRecordTitleCell';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext } from 'react';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledDiv = styled.div<{ isSummary: boolean }>`
  align-items: center;
  background: inherit;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  height: ${({ isSummary }) => (isSummary ? 'auto' : '24px')};
  justify-content: var(--record-title-justify-content, center);
  min-height: 24px;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[0]} 5px;
  white-space: ${({ isSummary }) => (isSummary ? 'normal' : 'nowrap')};
  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledEmptyText = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

export const RecordTitleFullNameFieldDisplay = ({
  containerType,
}: {
  containerType: string;
}) => {
  const { recordId, fieldDefinition } = useContext(FieldContext);

  const { openRecordTitleCell } = useRecordTitleCell();

  const { fieldValue } = useFullNameFieldDisplay();

  const content = [fieldValue?.firstName, fieldValue?.lastName]
    .filter(isNonEmptyString)
    .join(' ')
    .trim();

  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();

  const recordTitleCellId = getRecordFieldInputInstanceId({
    recordId,
    fieldName: fieldDefinition.metadata.fieldName,
    prefix: containerType,
  });

  return (
    <StyledDiv
      isSummary={containerType === RecordTitleCellContainerType.ShowPage}
      onClick={() => {
        pushFocusItemToFocusStack({
          focusId: recordTitleCellId,
          component: {
            type: FocusComponentType.OPENED_FIELD_INPUT,
            instanceId: recordTitleCellId,
          },
          globalHotkeysConfig: {
            enableGlobalHotkeysConflictingWithKeyboard: false,
          },
        });

        openRecordTitleCell({
          recordId,
          fieldMetadataItemId: fieldDefinition.fieldMetadataId,
          instanceId: getRecordFieldInputInstanceId({
            recordId,
            fieldName: fieldDefinition.metadata.fieldName,
            prefix: containerType,
          }),
        });
      }}
    >
      {!content ? (
        <StyledEmptyText>{t`Untitled`}</StyledEmptyText>
      ) : containerType === RecordTitleCellContainerType.ShowPage ? (
        <span>{content}</span>
      ) : (
        <OverflowingTextWithTooltip
          text={isNonEmptyString(content) ? content : fieldDefinition.label}
        />
      )}
    </StyledDiv>
  );
};
