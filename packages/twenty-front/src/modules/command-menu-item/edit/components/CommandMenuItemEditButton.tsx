import { styled } from '@linaria/react';
import { AnimatedIconCrossfade } from 'twenty-ui/layout';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { SidePanelPages } from 'twenty-shared/types';
import { IconPencil, IconX } from 'twenty-ui/icon';
import { AnimatedButton } from 'twenty-ui/input';

const StyledEditButton = styled(AnimatedButton)`
  box-sizing: border-box;
  gap: var(--t-button-gap, 4px);
  height: var(--t-page-header-action-height, var(--t-control-height-sm, 24px));
  padding: 0 var(--t-page-header-action-padding-x, 8px);
`;

export const CommandMenuItemEditButton = () => {
  const { t } = useLingui();
  const { navigateSidePanel } = useNavigateSidePanel();
  const { closeSidePanelMenu } = useSidePanelMenu();

  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);
  const sidePanelPage = useAtomStateValue(sidePanelPageState);

  const isCommandMenuEditPageActive =
    isSidePanelOpened && sidePanelPage === SidePanelPages.CommandMenuEdit;

  if (!isLayoutCustomizationModeEnabled) {
    return null;
  }

  const handleClick = () => {
    if (isCommandMenuEditPageActive) {
      closeSidePanelMenu();

      return;
    }

    navigateSidePanel({
      page: SidePanelPages.CommandMenuEdit,
      pageTitle: t`Edit actions`,
      pageIcon: IconPencil,
      resetNavigationStack: true,
    });
  };

  return (
    <StyledEditButton
      animatedSvg={
        <AnimatedIconCrossfade
          isActive={isCommandMenuEditPageActive}
          ActiveIcon={IconX}
          InactiveIcon={IconPencil}
        />
      }
      title={t`Edit actions`}
      variant="secondary"
      size="small"
      onClick={handleClick}
    />
  );
};
