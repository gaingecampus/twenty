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
import { useIsMobile } from 'twenty-ui/utilities';

const StyledRecordIndexInlineEditModeButton = styled(Button)`
  --btn-border-color: transparent !important;
  --btn-box-shadow: none !important;
  --btn-color: ${themeCssVariables.font.color.inverted} !important;
  --tw-button-color: ${themeCssVariables.font.color.inverted} !important;
  background: ${themeCssVariables.background.primaryInverted} !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: ${themeCssVariables.font.color.inverted} !important;
  flex-shrink: 0;
  height: 40px;

  &:active {
    background: ${themeCssVariables.background.primaryInvertedHover} !important;
  }

  &:hover {
    background: ${themeCssVariables.background.primaryInvertedHover} !important;
  }

  &:focus,
  &:focus-visible,
  &[data-focus] {
    --btn-border-color: transparent !important;
    --btn-box-shadow: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none;
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
  const isMobile = useIsMobile();

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
      title={
        isMobile
          ? undefined
          : isRecordIndexInlineEditModeEnabled
            ? t`Editing`
            : t`Edit`
      }
      variant="primary"
      accent="default"
      size="medium"
      onClick={handleClick}
      ariaLabel={isRecordIndexInlineEditModeEnabled ? t`Editing` : t`Edit`}
    />
  );
};
