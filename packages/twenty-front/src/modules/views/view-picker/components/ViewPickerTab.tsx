import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { StyledDropdownButtonContainer } from '@/ui/layout/dropdown/components/StyledDropdownButtonContainer';
import { type View } from '@/views/types/View';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconList, useIcons } from 'twenty-ui/icon';
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
  border: ${({ isUnfolded }) =>
    isUnfolded
      ? `var(--t-view-tab-active-border, var(--t-view-tab-border, none))`
      : `var(--t-view-tab-border, none)`};
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
  outline-offset: -2px;
  padding: 0 var(--t-view-tab-padding-x, ${themeCssVariables.spacing[2]});

  &:hover {
    background: ${({ isUnfolded }) =>
      isUnfolded
        ? `var(
          --t-view-tab-active-hover-bg,
          var(--t-view-tab-active-bg, transparent)
        )`
        : `var(
          --t-view-tab-hover-bg,
          ${themeCssVariables.background.transparent.light}
        )`};
    color: ${({ isUnfolded }) =>
      isUnfolded
        ? `var(--t-view-tab-active-color, ${themeCssVariables.font.color.primary})`
        : `var(--t-view-tab-hover-color, ${themeCssVariables.font.color.secondary})`};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
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
  background: var(
    --t-view-tab-count-bg,
    ${themeCssVariables.background.tertiary}
  );
  border-radius: ${themeCssVariables.border.radius.pill};
  color: var(
    --t-view-tab-count-color,
    ${themeCssVariables.font.color.secondary}
  );
  flex-shrink: 0;
  font-size: 12px;
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 20px;
  min-width: 20px;
  padding: 0 5px;
  text-align: center;
`;

type ViewPickerTabProps = {
  isCurrentView: boolean;
  totalCount?: number;
  view: Pick<
    View,
    'id' | 'name' | 'icon' | 'visibility' | 'createdByUserWorkspaceId'
  >;
  onSelect: (viewId: string) => void;
};

export const ViewPickerTab = ({
  isCurrentView,
  totalCount,
  view,
  onSelect,
}: ViewPickerTabProps) => {
  const { theme } = useContext(ThemeContext);
  const { formatNumber } = useNumberFormat();
  const { getIcon } = useIcons();
  const ViewIcon = getIcon(view.icon);
  const handleTabClick = () => {
    onSelect(view.id);
  };

  return (
    <StyledTabChip
      isUnfolded={isCurrentView}
      transparentBackground
      onClick={handleTabClick}
      role="tab"
      aria-selected={isCurrentView}
      tabIndex={isCurrentView ? 0 : -1}
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
        <StyledCount>{formatNumber(totalCount)}</StyledCount>
      )}
    </StyledTabChip>
  );
};
