import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { StyledDropdownButtonContainer } from '@/ui/layout/dropdown/components/StyledDropdownButtonContainer';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { type View } from '@/views/types/View';
import { ViewPickerViewOptionsMenuContent } from '@/views/view-picker/components/ViewPickerViewOptionsMenuContent';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type MouseEvent, useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconDotsVertical, IconList, useIcons } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import {
  MOBILE_VIEWPORT,
  ThemeContext,
  themeCssVariables,
} from 'twenty-ui/theme-constants';

const StyledTabChip = styled(StyledDropdownButtonContainer)`
  background: ${({ isUnfolded }) =>
    isUnfolded
      ? `var(--t-view-tab-active-bg, transparent)`
      : `var(--t-view-tab-bg, transparent)`};
  border: var(--t-view-tab-border, none);
  border-radius: var(
    --t-view-tab-radius,
    ${themeCssVariables.border.radius.sm}
  );
  color: ${({ isUnfolded }) =>
    isUnfolded
      ? `var(--t-view-tab-active-color, ${themeCssVariables.font.color.primary})`
      : `var(--t-view-tab-color, ${themeCssVariables.font.color.tertiary})`};
  flex-shrink: 0;
  font-size: var(--t-view-tab-font-size, inherit);
  font-weight: ${({ isUnfolded }) =>
    isUnfolded
      ? `var(--t-view-tab-active-weight, ${themeCssVariables.font.weight.semiBold})`
      : `var(--t-view-tab-weight, ${themeCssVariables.font.weight.medium})`};
  gap: ${themeCssVariables.spacing[1]};
  height: var(--t-view-tab-height, var(--t-toolbar-chip-height, auto));
  padding: 0 var(--t-view-tab-padding-x, ${themeCssVariables.spacing[2]});

  &:hover {
    background: var(
      --t-view-tab-hover-bg,
      ${themeCssVariables.background.transparent.light}
    );
    color: ${({ isUnfolded }) =>
      isUnfolded
        ? `var(--t-view-tab-active-color, ${themeCssVariables.font.color.primary})`
        : `var(--t-view-tab-hover-color, ${themeCssVariables.font.color.secondary})`};
  }

  &:hover [data-view-picker-tab-options],
  &:focus-within [data-view-picker-tab-options] {
    opacity: 1;
  }
`;

const StyledIconContainer = styled.span`
  display: flex;
  flex-shrink: 0;
`;

const StyledViewName = styled.span`
  max-width: 130px;
  min-width: 0;
  overflow: hidden;
  @media (max-width: 375px) {
    max-width: 90px;
  }
  @media (min-width: 376px) and (max-width: ${MOBILE_VIEWPORT}px) {
    max-width: 110px;
  }
`;

const StyledCount = styled.span`
  color: var(--t-view-tab-count-color, ${themeCssVariables.font.color.light});
  flex-shrink: 0;
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledOptionsButton = styled.div<{ isVisible: boolean }>`
  display: flex;
  flex-shrink: 0;
  margin-left: ${themeCssVariables.spacing[1]};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`;

type ViewPickerTabProps = {
  isCurrentView: boolean;
  isIndexView: boolean;
  isLastView: boolean;
  isReadOnly?: boolean;
  totalCount?: number;
  view: Pick<
    View,
    'id' | 'name' | 'icon' | 'visibility' | 'createdByUserWorkspaceId'
  >;
  onEdit: (event: MouseEvent<HTMLElement>, viewId: string) => void;
  onSelect: (viewId: string) => void;
};

export const ViewPickerTab = ({
  isCurrentView,
  isIndexView,
  isLastView,
  isReadOnly = false,
  totalCount,
  view,
  onEdit,
  onSelect,
}: ViewPickerTabProps) => {
  const { t } = useLingui();
  const { theme } = useContext(ThemeContext);
  const { formatNumber } = useNumberFormat();
  const { getIcon } = useIcons();
  const ViewIcon = getIcon(view.icon);
  const optionsDropdownId = `view-picker-tab-options-${view.id}`;
  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    optionsDropdownId,
  );

  const handleTabClick = () => {
    onSelect(view.id);
  };

  const handleOptionsClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <StyledTabChip
      isUnfolded={isCurrentView}
      transparentBackground
      onClick={handleTabClick}
      role="tab"
      aria-selected={isCurrentView}
    >
      <StyledIconContainer>
        {isDefined(ViewIcon) ? (
          <ViewIcon size={theme.icon.size.sm} color="currentColor" />
        ) : (
          <IconList size={theme.icon.size.sm} color="currentColor" />
        )}
      </StyledIconContainer>
      <StyledViewName>
        <OverflowingTextWithTooltip text={view.name} />
      </StyledViewName>
      {isCurrentView && isDefined(totalCount) && (
        <StyledCount>· {formatNumber(totalCount)}</StyledCount>
      )}
      {!isReadOnly && (
        <StyledOptionsButton
          data-view-picker-tab-options
          isVisible={isDropdownOpen}
          onClick={handleOptionsClick}
        >
          <Dropdown
            dropdownId={optionsDropdownId}
            dropdownPlacement="bottom-start"
            clickableComponent={
              <LightIconButton
                Icon={IconDotsVertical}
                size="small"
                accent="tertiary"
                aria-label={t`View options`}
              />
            }
            dropdownComponents={
              <ViewPickerViewOptionsMenuContent
                view={view}
                isIndexView={isIndexView}
                isLastView={isLastView}
                dropdownId={optionsDropdownId}
                onEdit={onEdit}
              />
            }
          />
        </StyledOptionsButton>
      )}
    </StyledTabChip>
  );
};
