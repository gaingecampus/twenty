import { CommandMenuItemRenderer } from '@/command-menu-item/display/components/CommandMenuItemRenderer';
import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { PinnedCommandMenuItemsInlineMeasurements } from '@/command-menu-item/display/components/PinnedCommandMenuItemsInlineMeasurements';
import { PINNED_COMMAND_MENU_ITEMS_GAP } from '@/command-menu-item/display/constants/PinnedCommandMenuItemsGap';
import { usePinnedCommandMenuItemsInlineLayout } from '@/command-menu-item/display/hooks/usePinnedCommandMenuItemsInlineLayout';
import { NodeDimension } from '@/ui/utilities/dimensions/components/NodeDimension';
import { styled } from '@linaria/react';
import { motion } from 'framer-motion';
import { useContext, useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { ThemeContext } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';
import {
  EngineComponentKey,
  type CommandMenuItemFieldsFragment,
} from '~/generated-metadata/graphql';

const StyledCommandMenuItemContainer = styled(motion.div)`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
`;

const StyledPrimaryCommandMenuItemContainer = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
`;

const StyledWrapper = styled.div`
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
`;

const StyledContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  width: 100%;
`;

const StyledItemsContainer = styled.div`
  display: flex;
  gap: ${PINNED_COMMAND_MENU_ITEMS_GAP}px;
  max-width: 100%;
  overflow: hidden;
`;

export const PinnedCommandMenuItemButtons = () => {
  const { theme } = useContext(ThemeContext);
  const { commandMenuItems } = useContext(CommandMenuContext);
  const isMobile = useIsMobile();

  const pinnedCommandMenuItems = useMemo(
    () => commandMenuItems.filter((item) => item.isPinned === true),
    [commandMenuItems],
  );

  const primaryPinnedCommandMenuItem = useMemo(
    () =>
      pinnedCommandMenuItems.find(
        (item) =>
          item.engineComponentKey === EngineComponentKey.CREATE_NEW_RECORD,
      ),
    [pinnedCommandMenuItems],
  );

  const overflowCandidatePinnedCommandMenuItems = useMemo(
    () =>
      pinnedCommandMenuItems.filter(
        (item) =>
          item.engineComponentKey !== EngineComponentKey.CREATE_NEW_RECORD,
      ),
    [pinnedCommandMenuItems],
  );

  const {
    pinnedInlineCommandMenuItems,
    pinnedOverflowCommandMenuItems,
    onContainerDimensionChange,
    onCommandMenuItemDimensionChange,
  } = usePinnedCommandMenuItemsInlineLayout({
    pinnedCommandMenuItems: overflowCandidatePinnedCommandMenuItems,
  });

  const renderPinnedCommandMenuItemButton = (
    item: CommandMenuItemFieldsFragment,
    { isIconOnly = false }: { isIconOnly?: boolean } = {},
  ) => (
    <StyledCommandMenuItemContainer
      key={item.id}
      layout
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'unset', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{
        duration: theme.animation.duration.instant,
        ease: 'easeInOut',
      }}
    >
      <CommandMenuItemRenderer
        item={item}
        isPrimaryAction={
          item.engineComponentKey === EngineComponentKey.CREATE_NEW_RECORD
        }
        isIconOnly={isIconOnly}
      />
    </StyledCommandMenuItemContainer>
  );

  const hasOverflowCandidatePinnedCommandMenuItems =
    overflowCandidatePinnedCommandMenuItems.length > 0;

  return (
    <>
      {hasOverflowCandidatePinnedCommandMenuItems && (
        <PinnedCommandMenuItemsInlineMeasurements
          pinnedCommandMenuItems={[
            ...pinnedInlineCommandMenuItems,
            ...pinnedOverflowCommandMenuItems,
          ]}
          onPinnedCommandMenuItemDimensionChange={
            onCommandMenuItemDimensionChange
          }
        />
      )}
      {hasOverflowCandidatePinnedCommandMenuItems && !isMobile && (
        <StyledWrapper>
          <NodeDimension onDimensionChange={onContainerDimensionChange}>
            <StyledContainer>
              <StyledItemsContainer>
                {pinnedInlineCommandMenuItems.map((item) =>
                  renderPinnedCommandMenuItemButton(item),
                )}
              </StyledItemsContainer>
            </StyledContainer>
          </NodeDimension>
        </StyledWrapper>
      )}
      {isDefined(primaryPinnedCommandMenuItem) && (
        <StyledPrimaryCommandMenuItemContainer>
          <CommandMenuItemRenderer
            item={primaryPinnedCommandMenuItem}
            isPrimaryAction
            isIconOnly={isMobile}
          />
        </StyledPrimaryCommandMenuItemContainer>
      )}
    </>
  );
};
