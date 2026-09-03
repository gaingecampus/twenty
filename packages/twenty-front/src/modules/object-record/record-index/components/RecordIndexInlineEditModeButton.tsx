import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { isRecordIndexInlineEditModeEnabledState } from '@/object-record/record-index/states/isRecordIndexInlineEditModeEnabledState';
import { useCloseCurrentTableCellInEditMode } from '@/object-record/record-table/hooks/internal/useCloseCurrentTableCellInEditMode';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconLock, IconPencil } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRecordIndexInlineEditModeButton = styled(Button)`
  --btn-color: ${themeCssVariables.font.color.inverted} !important;
  --tw-button-color: ${themeCssVariables.font.color.inverted} !important;
  background: ${themeCssVariables.background.primaryInverted} !important;
  border-color: transparent !important;
  color: ${themeCssVariables.font.color.inverted} !important;
  height: 40px;

  &:active {
    background: ${themeCssVariables.background.primaryInvertedHover} !important;
  }

  &:hover {
    background: ${themeCssVariables.background.primaryInvertedHover} !important;
  }

  svg {
    color: ${themeCssVariables.font.color.inverted};
    stroke: ${themeCssVariables.font.color.inverted};
  }
`;

export const RecordIndexInlineEditModeButton = () => {
  const {
    objectMetadataItem,
    objectPermissionsByObjectMetadataId,
    recordIndexId,
  } = useRecordIndexContextOrThrow();

  const objectPermissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataItem.id,
  );

  const [
    isRecordIndexInlineEditModeEnabled,
    setIsRecordIndexInlineEditModeEnabled,
  ] = useAtomState(isRecordIndexInlineEditModeEnabledState);

  const closeCurrentTableCellInEditMode =
    useCloseCurrentTableCellInEditMode(recordIndexId);

  if (objectPermissions.canUpdateObjectRecords !== true) {
    return null;
  }

  const handleClick = () => {
    if (isRecordIndexInlineEditModeEnabled) {
      closeCurrentTableCellInEditMode();
      setIsRecordIndexInlineEditModeEnabled(false);

      return;
    }

    setIsRecordIndexInlineEditModeEnabled(true);
  };

  return (
    <StyledRecordIndexInlineEditModeButton
      Icon={isRecordIndexInlineEditModeEnabled ? IconPencil : IconLock}
      title={isRecordIndexInlineEditModeEnabled ? t`Editing` : t`Edit`}
      variant="primary"
      accent="default"
      size="medium"
      onClick={handleClick}
      ariaLabel={isRecordIndexInlineEditModeEnabled ? t`Editing` : t`Edit`}
    />
  );
};
