import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { IconMessageCirclePlus } from 'twenty-ui/icon';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';

import { useSwitchToNewAiChat } from '@/ai/hooks/useSwitchToNewAiChat';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledNewChatIcon = styled.div`
  align-items: center;
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  justify-content: center;

  svg.tabler-icon {
    stroke-width: var(--t-nav-new-chat-icon-stroke, 2.25);
  }
`;

const StyledNewChatButtonWrapper = styled.div<{
  isExpanded: boolean;
}>`
  align-items: center;
  align-self: ${({ isExpanded }) => (isExpanded ? 'stretch' : 'center')};
  background: var(
    --t-nav-new-chat-bg,
    ${themeCssVariables.background.secondary}
  );
  border: var(
    --t-nav-new-chat-border,
    1px solid ${themeCssVariables.border.color.medium}
  );
  border-radius: var(
    --t-nav-new-chat-radius,
    var(--t-search-radius, ${themeCssVariables.border.radius.sm})
  );
  box-sizing: border-box;
  display: flex;
  height: ${({ isExpanded }) =>
    isExpanded
      ? `var(--t-search-height, ${themeCssVariables.spacing[8]})`
      : `var(
          --t-nav-new-chat-collapsed-size,
          ${themeCssVariables.spacing[6]}
        )`};
  justify-content: center;
  flex: var(--t-nav-new-chat-flex, 0 0 auto);
  margin-left: ${({ isExpanded }) => (isExpanded ? 'auto' : '0')};
  min-width: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-new-chat-min-width, auto)'
      : `var(
          --t-nav-new-chat-collapsed-size,
          ${themeCssVariables.spacing[6]}
        )`};
  padding: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-new-chat-padding, 0)'
      : `var(
          --t-nav-new-chat-collapsed-padding,
          ${themeCssVariables.spacing[0.5]}
        )`};
  width: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-new-chat-width, auto)'
      : `var(
          --t-nav-new-chat-collapsed-size,
          ${themeCssVariables.spacing[6]}
        )`};
`;

const StyledNewChatButton = styled.div`
  align-items: center;
  border-radius: inherit;
  color: var(--t-nav-new-chat-color, ${themeCssVariables.font.color.secondary});
  cursor: pointer;
  display: flex;
  font-size: var(--t-nav-new-chat-font-size, ${themeCssVariables.font.size.md});
  font-weight: var(
    --t-nav-new-chat-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  gap: var(--t-button-gap, ${themeCssVariables.spacing[1]});
  height: 100%;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  padding-inline: var(
    --t-nav-new-chat-padding-x,
    ${themeCssVariables.spacing[2]}
  );
  transition:
    background calc(${themeCssVariables.animation.duration.fast} * 1s) ease,
    color calc(${themeCssVariables.animation.duration.fast} * 1s) ease;
  white-space: nowrap;
  width: 100%;

  &:hover {
    background: var(
      --t-nav-new-chat-hover-bg,
      ${themeCssVariables.background.transparent.light}
    );
    color: var(
      --t-nav-new-chat-hover-color,
      var(--t-nav-new-chat-color, ${themeCssVariables.font.color.primary})
    );
  }
`;

export const MainNavigationDrawerNewChatButton = () => {
  const { theme } = useContext(ThemeContext);
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  const { switchToNewChat } = useSwitchToNewAiChat();
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const isExpanded = isNavigationDrawerExpanded || isMobile;

  if (!hasAiPermission) {
    return null;
  }

  const handleNewChatClick = () => {
    if (isMobile) {
      setIsNavigationDrawerExpanded(false);
    }
    switchToNewChat();
  };

  const handleNewChatKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNewChatClick();
    }
  };

  return (
    <StyledNewChatButtonWrapper
      data-nav-new-chat-button="true"
      isExpanded={isExpanded}
    >
      <StyledNewChatButton
        role="button"
        tabIndex={0}
        aria-label={t`New chat`}
        onClick={handleNewChatClick}
        onKeyDown={handleNewChatKeyDown}
      >
        <StyledNewChatIcon data-nav-new-chat-icon="true">
          <IconMessageCirclePlus
            size={theme.icon.size.md}
            stroke={theme.icon.stroke.lg}
            color="currentColor"
          />
        </StyledNewChatIcon>
        {isExpanded && !isMobile && (
          <OverflowingTextWithTooltip text={t`New chat`} />
        )}
      </StyledNewChatButton>
    </StyledNewChatButtonWrapper>
  );
};
