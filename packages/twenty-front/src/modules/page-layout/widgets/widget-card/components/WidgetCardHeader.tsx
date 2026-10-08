import { WidgetActionRenderer } from '@/page-layout/widgets/components/WidgetActionRenderer';
import { widgetCardHoveredComponentFamilyState } from '@/page-layout/widgets/states/widgetCardHoveredComponentFamilyState';
import { type WidgetAction } from '@/page-layout/widgets/types/WidgetAction';
import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type ReactNode, useContext, useId } from 'react';
import { IconInfoCircle, IconTrash } from 'twenty-ui/icon';
import {
  AppTooltip,
  TooltipDelay,
  OverflowingTextWithTooltip,
} from 'twenty-ui/surfaces';
import { IconButton } from 'twenty-ui/input';

import { type WidgetCardVariant } from '@/page-layout/widgets/types/WidgetCardVariant';
import { WidgetGrip } from '@/page-layout/widgets/widget-card/components/WidgetGrip';
import { AnimatePresence, motion } from 'framer-motion';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';
import { themeCssVariables, ThemeContext } from 'twenty-ui/theme-constants';
export type WidgetCardHeaderProps = {
  variant: WidgetCardVariant;
  widgetId: string;
  isInEditMode: boolean;
  isEmpty?: boolean;
  title: string;
  titleHelp?: string;
  onRemove?: (e?: React.MouseEvent) => void;
  forbiddenDisplay?: ReactNode;
  actions?: WidgetAction[];
  className?: string;
  isResizing?: boolean;
  isReorderEnabled?: boolean;
  isDeletingWidgetEnabled?: boolean;
};

const StyledWidgetCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[6]};
`;

const StyledTitleContainer = styled.div<{ variant: WidgetCardVariant }>`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  overflow: hidden;
  padding-inline: ${({ variant }) =>
    variant === 'side-column' ? '0' : themeCssVariables.spacing[1]};

  user-select: none;
`;

const StyledInfoButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: help;
  display: inline-flex;
  padding: 0;
`;

const StyledRightContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[0.5]};
`;

const StyledActionsContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledIconButtonContainerBase = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`;
const StyledIconButtonContainer = motion.create(StyledIconButtonContainerBase);

export const WidgetCardHeader = ({
  widgetId,
  variant,
  isEmpty = false,
  isInEditMode = false,
  isResizing = false,
  isReorderEnabled = true,
  isDeletingWidgetEnabled = true,
  title,
  titleHelp,
  onRemove,
  forbiddenDisplay,
  actions,
  className,
}: WidgetCardHeaderProps) => {
  const { theme } = useContext(ThemeContext);
  const helpId = `widget-help-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const widgetCardHovered = useAtomComponentFamilyStateValue(
    widgetCardHoveredComponentFamilyState,
    widgetId,
  );

  return (
    <StyledWidgetCardHeader className={className}>
      <AnimatePresence initial={false}>
        {!isEmpty && isInEditMode && isReorderEnabled && (
          <WidgetGrip
            className="drag-handle"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </AnimatePresence>
      <StyledTitleContainer variant={variant}>
        <OverflowingTextWithTooltip text={isEmpty ? t`Add Widget` : title} />
        {titleHelp && !isEmpty && (
          <>
            <span id={helpId}>
              <StyledInfoButton type="button" aria-label={`${title} 도움말`}>
                <IconInfoCircle size={16} />
              </StyledInfoButton>
            </span>
            <AppTooltip
              anchorSelect={`#${helpId}`}
              content={titleHelp}
              place="top"
              delay={TooltipDelay.shortDelay}
              positionStrategy="fixed"
            />
          </>
        )}
      </StyledTitleContainer>
      <StyledRightContainer>
        {isNonEmptyArray(actions) && (
          <StyledActionsContainer>
            {actions.map((action) => (
              <WidgetActionRenderer key={action.id} action={action} />
            ))}
          </StyledActionsContainer>
        )}
        {isDefined(forbiddenDisplay) && forbiddenDisplay}
        <AnimatePresence initial={false}>
          {!isResizing &&
            !isEmpty &&
            isInEditMode &&
            isDeletingWidgetEnabled &&
            onRemove &&
            widgetCardHovered && (
              <StyledIconButtonContainer
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  duration: theme.animation.duration.fast,
                  ease: 'easeInOut',
                }}
              >
                <IconButton
                  onClick={onRemove}
                  Icon={IconTrash}
                  variant="tertiary"
                  size="small"
                />
              </StyledIconButtonContainer>
            )}
        </AnimatePresence>
      </StyledRightContainer>
    </StyledWidgetCardHeader>
  );
};
