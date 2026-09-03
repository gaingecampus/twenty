import { styled } from '@linaria/react';
import { useContext } from 'react';

import { fieldMetadataItemByIdSelector } from '@/object-metadata/states/fieldMetadataItemByIdSelector';
import { isFieldMetadataItemLabelIdentifierSelector } from '@/object-metadata/states/isFieldMetadataItemLabelIdentifierSelector';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { getFieldDefinitionForRecordField } from '@/object-record/record-field/utils/getFieldDefinitionForRecordField';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { shouldCompactRecordTableFirstColumnComponentState } from '@/object-record/record-table/states/shouldCompactRecordTableFirstColumnComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useIcons } from 'twenty-ui/icon';
import {
  MOBILE_VIEWPORT,
  ThemeContext,
  themeCssVariables,
} from 'twenty-ui/theme-constants';

const StyledTitle = styled.div<{ hideTitle?: boolean }>`
  align-items: center;
  display: flex;
  flex-direction: row;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: 100%;
  padding-left: ${themeCssVariables.table.horizontalCellPadding};
  padding-right: ${themeCssVariables.table.horizontalCellPadding};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    display: ${({ hideTitle }) => (hideTitle ? 'none' : 'flex')};
  }
`;

const StyledIcon = styled.div`
  display: flex;
  flex-shrink: 0;

  & > svg {
    height: ${themeCssVariables.icon.size.md}px;
    width: ${themeCssVariables.icon.size.md}px;
  }
`;

const StyledText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type RecordTableColumnHeadProps = {
  recordField: RecordField;
};

export const RecordTableColumnHead = ({
  recordField,
}: RecordTableColumnHeadProps) => {
  const { theme } = useContext(ThemeContext);

  const {
    fieldDefinitionByFieldMetadataItemId,
    fieldDefinitionByViewFieldId,
  } = useRecordIndexContextOrThrow();

  const fieldDefinition = getFieldDefinitionForRecordField({
    recordField,
    fieldDefinitionByViewFieldId,
    fieldDefinitionByFieldMetadataItemId,
  });

  const correspondingFieldMetadataItem = useAtomFamilySelectorValue(
    fieldMetadataItemByIdSelector,
    { fieldMetadataItemId: recordField.fieldMetadataItemId },
  );

  const { getIcon } = useIcons();
  const Icon = getIcon(
    fieldDefinition?.iconName ??
      correspondingFieldMetadataItem.foundFieldMetadataItem?.icon,
  );

  const isLabelIdentifier = useAtomFamilySelectorValue(
    isFieldMetadataItemLabelIdentifierSelector,
    { fieldMetadataItemId: recordField.fieldMetadataItemId },
  );

  const shouldCompactRecordTableFirstColumn = useAtomComponentStateValue(
    shouldCompactRecordTableFirstColumnComponentState,
  );

  const shouldHideTitle =
    shouldCompactRecordTableFirstColumn && isLabelIdentifier;

  return (
    <StyledTitle hideTitle={shouldHideTitle}>
      <StyledIcon>
        <Icon size={theme.icon.size.md} />
      </StyledIcon>
      <StyledText>
        {fieldDefinition?.label ??
          correspondingFieldMetadataItem.foundFieldMetadataItem?.label}
      </StyledText>
    </StyledTitle>
  );
};
