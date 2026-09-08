import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { hasAnySoftDeleteFilterOnViewComponentSelector } from '@/object-record/record-filter/states/hasAnySoftDeleteFilterOnView';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { canCreateRecordsForObjectMetadataItem } from '@/object-record/utils/canCreateRecordsForObjectMetadataItem';
import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type IconComponent } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  type AnimatedPlaceholderType,
} from 'twenty-ui/feedback';

const StyledEmptyPlaceholderOuterContainer = styled.div<{
  visibleWidth?: number;
}>`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  justify-content: center;
  left: 0;
  max-width: 100%;
  min-height: 320px;
  padding: ${themeCssVariables.spacing[8]} ${themeCssVariables.spacing[4]};
  position: sticky;
  text-align: center;
  width: ${({ visibleWidth }) => (visibleWidth ? `${visibleWidth}px` : '100%')};
`;

const StyledSubtitle = styled(AnimatedPlaceholderEmptySubTitle)`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  max-height: none;
  max-width: 420px;
  overflow: visible;
  width: 100%;
  word-break: keep-all;
`;

type RecordTableEmptyStateDisplayButtonComponentProps = {
  buttonComponent?: React.ReactNode;
};

type RecordTableEmptyStateDisplayButtonProps = {
  ButtonIcon: IconComponent;
  buttonTitle: string;
  onClick: () => void;
  buttonIsDisabled?: boolean;
};

type RecordTableEmptyStateDisplayProps = {
  animatedPlaceholderType: AnimatedPlaceholderType;
  title: string;
  subTitle: string;
} & (
  | RecordTableEmptyStateDisplayButtonComponentProps
  | RecordTableEmptyStateDisplayButtonProps
);

export const RecordTableEmptyStateDisplay = (
  props: RecordTableEmptyStateDisplayProps,
) => {
  const { objectMetadataItem } = useRecordTableContextOrThrow();
  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const canCreateRecords =
    !isLayoutCustomizationModeEnabled &&
    canCreateRecordsForObjectMetadataItem({
      objectPermissions,
      objectMetadataItem,
    });

  const hasAnySoftDeleteFilterOnView = useAtomComponentSelectorValue(
    hasAnySoftDeleteFilterOnViewComponentSelector,
  );

  const { scrollWrapperHTMLElement } = useScrollWrapperHTMLElement();

  const scrollWrapperWidth = scrollWrapperHTMLElement?.clientWidth;

  return (
    <StyledEmptyPlaceholderOuterContainer visibleWidth={scrollWrapperWidth}>
      <AnimatedPlaceholder type={props.animatedPlaceholderType} />
      <AnimatedPlaceholderEmptyTextContainer role="status" aria-live="polite">
        <AnimatedPlaceholderEmptyTitle>
          {props.title}
        </AnimatedPlaceholderEmptyTitle>
        <StyledSubtitle>{props.subTitle}</StyledSubtitle>
      </AnimatedPlaceholderEmptyTextContainer>
      {'buttonComponent' in props && props.buttonComponent}
      {'buttonTitle' in props &&
        canCreateRecords &&
        !hasAnySoftDeleteFilterOnView && (
          <Button
            Icon={props.ButtonIcon}
            title={props.buttonTitle}
            variant="primary"
            accent="blue"
            onClick={props.onClick}
            disabled={props.buttonIsDisabled}
          />
        )}
    </StyledEmptyPlaceholderOuterContainer>
  );
};
