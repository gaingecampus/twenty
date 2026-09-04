import { ObjectMetadataIcon } from '@/object-metadata/components/ObjectMetadataIcon';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getLabelIdentifierFieldValue } from '@/object-metadata/utils/getLabelIdentifierFieldValue';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TrashDeletedByDisplay } from '@/trash/components/TrashDeletedByDisplay';
import { StyledTrashListGrid } from '@/trash/components/TrashListGrid';
import { DateTimeDisplay } from '@/ui/field/display/components/DateTimeDisplay';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { LinkChip } from 'twenty-ui/data-display';
import { IconRefresh, IconTrashX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRow = styled(StyledTrashListGrid)`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};

  &:hover {
    background: ${themeCssVariables.background.secondary};
  }
`;

const StyledSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledNameCell = styled.div`
  min-width: 0;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: flex-end;
`;

type TrashRecordRowProps = {
  record: ObjectRecord;
  objectMetadataItem: EnrichedObjectMetadataItem;
  labelIdentifierFieldMetadataItem: FieldMetadataItem | undefined;
  canRestore: boolean;
  canDestroy: boolean;
  isActionInProgress: boolean;
  onRestore: () => void;
  onDestroy: () => void;
};

export const TrashRecordRow = ({
  record,
  objectMetadataItem,
  labelIdentifierFieldMetadataItem,
  canRestore,
  canDestroy,
  isActionInProgress,
  onRestore,
  onDestroy,
}: TrashRecordRowProps) => {
  const recordLabel = getLabelIdentifierFieldValue(
    record,
    labelIdentifierFieldMetadataItem,
  );

  const recordShowPath = getAppPath(AppPath.RecordShowPage, {
    objectNameSingular: objectMetadataItem.nameSingular,
    objectRecordId: record.id,
  });

  return (
    <StyledRow>
      <StyledNameCell>
        <LinkChip
          to={recordShowPath}
          label={recordLabel || record.id}
          leftComponent={
            <ObjectMetadataIcon
              objectMetadataItem={objectMetadataItem}
              size={16}
            />
          }
        />
      </StyledNameCell>
      <StyledSecondaryText>
        {objectMetadataItem.labelSingular}
      </StyledSecondaryText>
      <StyledSecondaryText>
        <DateTimeDisplay value={record.deletedAt} />
      </StyledSecondaryText>
      <StyledNameCell>
        <TrashDeletedByDisplay deletedBy={record.updatedBy} />
      </StyledNameCell>
      <StyledActions>
        {canRestore && (
          <Button
            title={t`Restore`}
            Icon={IconRefresh}
            size="small"
            variant="secondary"
            disabled={isActionInProgress}
            onClick={onRestore}
          />
        )}
        {canDestroy && (
          <Button
            title={t`Destroy`}
            Icon={IconTrashX}
            size="small"
            variant="secondary"
            accent="danger"
            disabled={isActionInProgress}
            onClick={onDestroy}
          />
        )}
      </StyledActions>
    </StyledRow>
  );
};
