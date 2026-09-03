import { RecordChip } from '@/object-record/components/RecordChip';
import { StopPropagationContainer } from '@/object-record/record-board/record-board-card/components/StopPropagationContainer';
import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { isRecordGalleryCardSelectedComponentFamilyState } from '@/object-record/record-gallery/record-gallery-card/states/isRecordGalleryCardSelectedComponentFamilyState';
import { RecordCardHeaderContainer } from '@/object-record/record-card/components/RecordCardHeaderContainer';
import { isDraggingRecordComponentState } from '@/object-record/record-drag/states/isDraggingRecordComponentState';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { useOpenRecordFromIndexView } from '@/object-record/record-index/hooks/useOpenRecordFromIndexView';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { styled } from '@linaria/react';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { isDefined } from 'twenty-shared/utils';
import { ChipVariant } from 'twenty-ui/data-display';
import { Checkbox, CheckboxVariant } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCheckboxContainer = styled.div`
  margin-left: auto;
`;

const StyledRecordChipContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[1]};
`;

type RecordGalleryCardHeaderProps = {
  recordId: string;
};

export const RecordGalleryCardHeader = ({
  recordId,
}: RecordGalleryCardHeaderProps) => {
  const { objectMetadataItem } = useRecordGalleryContextOrThrow();
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);
  const { openRecordFromIndexView } = useOpenRecordFromIndexView();
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  const { currentView } = useGetCurrentViewOnly();

  const isCompactModeActive = currentView?.isCompact ?? false;

  const isDraggingRecord = useAtomComponentStateValue(
    isDraggingRecordComponentState,
  );

  const [isRecordGalleryCardSelected, setIsRecordGalleryCardSelected] =
    useAtomComponentFamilyState(
      isRecordGalleryCardSelectedComponentFamilyState,
      recordId,
    );

  const handleChipClick = () => {
    if (isDraggingRecord) {
      return;
    }
    openRecordFromIndexView({ recordId });
  };

  if (!isDefined(recordStore)) {
    return null;
  }

  return (
    <RecordCardHeaderContainer
      isCompact={isCompactModeActive}
      padding={themeCssVariables.spacing[1]}
    >
      <StyledRecordChipContainer>
        <StopPropagationContainer>
          <RecordChip
            objectNameSingular={objectMetadataItem.nameSingular}
            record={recordStore}
            variant={ChipVariant.Transparent}
            onClick={handleChipClick}
            triggerEvent={'CLICK'}
          />
        </StopPropagationContainer>
      </StyledRecordChipContainer>
      {isInlineEditEnabled && (
        <StyledCheckboxContainer className="checkbox-container">
          <StopPropagationContainer>
            <Checkbox
              hoverable
              checked={isRecordGalleryCardSelected}
              onChange={(value) => {
                setIsRecordGalleryCardSelected(value.target.checked);
              }}
              variant={CheckboxVariant.Secondary}
            />
          </StopPropagationContainer>
        </StyledCheckboxContainer>
      )}
    </RecordCardHeaderContainer>
  );
};
