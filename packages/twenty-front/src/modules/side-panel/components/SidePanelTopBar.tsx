import { sidePanelHeaderActionsElementState } from '@/side-panel/states/sidePanelHeaderActionsElementState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { SidePanelBackButton } from '@/side-panel/components/SidePanelBackButton';
import { SidePanelPageInfo } from '@/side-panel/components/SidePanelPageInfo';
import { SidePanelTopBarInputFocusEffect } from '@/side-panel/components/SidePanelTopBarInputFocusEffect';
import { SidePanelTopBarRightCornerIcon } from '@/side-panel/components/SidePanelTopBarRightCornerIcon';
import { COMMAND_MENU_SIDE_PANEL_PAGES } from '@/side-panel/constants/CommandMenuSidePanelPages';
import { SIDE_PANEL_TOP_BAR_HEIGHT } from '@/side-panel/constants/SidePanelTopBarHeight';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useSidePanelContextChips } from '@/side-panel/hooks/useSidePanelContextChips';
import { sidePanelNavigationStackState } from '@/side-panel/states/sidePanelNavigationStackState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { sidePanelSearchState } from '@/side-panel/states/sidePanelSearchState';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useContext, useRef } from 'react';
import { IconX } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { useIsMobile } from 'twenty-ui/utilities';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledInputContainer = styled.div`
  align-items: center;
  background-color: ${themeCssVariables.background.secondary};
  border: none;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 0;
  box-sizing: border-box;
  container-name: side-panel-header;
  container-type: inline-size;

  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.lg};
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
  margin: 0;
  min-height: var(--t-page-bar-min-height, ${SIDE_PANEL_TOP_BAR_HEIGHT}px);

  outline: none;
  overflow: hidden;
  padding: var(--t-page-header-padding-y, 0)
    var(--t-page-header-padding-y, ${themeCssVariables.spacing[3]});
  position: relative;
`;

const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  border-radius: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  height: 24px;
  margin: 0;
  outline: none;
  padding: 0;

  &::placeholder {
    color: ${themeCssVariables.font.color.light};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledContentContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  overflow: hidden;
`;

const StyledRightControlsContainer = styled.div`
  --t-control-height-sm: 32px;

  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledCloseButton = styled(IconButton)`
  flex-shrink: 0;

  svg {
    height: 16px;
    width: 16px;
  }
`;

export const SidePanelTopBar = () => {
  const setSidePanelHeaderActionsElement = useSetAtomState(
    sidePanelHeaderActionsElementState,
  );
  const [sidePanelSearch, setSidePanelSearch] =
    useAtomState(sidePanelSearchState);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useLingui();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSidePanelSearch(event.target.value);
  };

  const isMobile = useIsMobile();

  const { closeSidePanelMenu } = useSidePanelMenu();

  const sidePanelPage = useAtomStateValue(sidePanelPageState);

  const sidePanelNavigationStack = useAtomStateValue(
    sidePanelNavigationStackState,
  );

  const { theme } = useContext(ThemeContext);

  const { contextChips } = useSidePanelContextChips();

  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  const handleInputFocus = () => {
    pushFocusItemToFocusStack({
      focusId: SIDE_PANEL_FOCUS_ID,
      component: {
        type: FocusComponentType.TEXT_INPUT,
        instanceId: SIDE_PANEL_FOCUS_ID,
      },
      globalHotkeysConfig: {
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  };

  const handleInputBlur = () => {
    removeFocusItemFromFocusStackById({
      focusId: SIDE_PANEL_FOCUS_ID,
    });
  };

  const currentPage = sidePanelNavigationStack.at(-1)?.page;
  const previousPage = sidePanelNavigationStack.at(-2)?.page;

  const canGoBack =
    currentPage !== undefined &&
    COMMAND_MENU_SIDE_PANEL_PAGES.includes(currentPage)
      ? previousPage !== undefined &&
        COMMAND_MENU_SIDE_PANEL_PAGES.includes(previousPage)
      : sidePanelNavigationStack.length > 1;

  const shouldShowBackButton = canGoBack;

  const shouldHideCloseButton = isMobile && shouldShowBackButton;

  const lastChip = contextChips.at(-1);

  return (
    <StyledInputContainer>
      <StyledContentContainer>
        <AnimatePresence>
          {shouldShowBackButton && (
            <motion.div
              key="side-panel-back-button"
              exit={{ opacity: 0, width: 0 }}
              transition={{
                duration: theme.animation.duration.instant,
              }}
            >
              <SidePanelBackButton />
            </motion.div>
          )}
        </AnimatePresence>
        {lastChip && !COMMAND_MENU_SIDE_PANEL_PAGES.includes(sidePanelPage) && (
          <SidePanelPageInfo pageChip={lastChip} />
        )}
        {COMMAND_MENU_SIDE_PANEL_PAGES.includes(sidePanelPage) && (
          <>
            <StyledInput
              data-testid={SIDE_PANEL_FOCUS_ID}
              ref={inputRef}
              value={sidePanelSearch}
              placeholder={t`Type anything...`}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <SidePanelTopBarInputFocusEffect inputRef={inputRef} />
          </>
        )}
      </StyledContentContainer>
      <StyledRightControlsContainer>
        <StyledRightControlsContainer ref={setSidePanelHeaderActionsElement} />
        <SidePanelTopBarRightCornerIcon />
        {!shouldHideCloseButton && (
          <StyledCloseButton
            Icon={IconX}
            size="small"
            variant="secondary"
            onClick={closeSidePanelMenu}
            ariaLabel={t`Close side panel`}
          />
        )}
      </StyledRightControlsContainer>
    </StyledInputContainer>
  );
};
