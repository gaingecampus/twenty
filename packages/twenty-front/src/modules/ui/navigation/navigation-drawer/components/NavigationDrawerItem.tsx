import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useNavigationDrawerExpanded } from '@/navigation/hooks/useNavigationDrawerExpanded';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItemBreadcrumb } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItemBreadcrumb';
import { useNavigationDrawerTooltip } from '@/ui/navigation/navigation-drawer/hooks/useNavigationDrawerTooltip';
import { type NavigationDrawerSubItemState } from '@/ui/navigation/navigation-drawer/types/NavigationDrawerSubItemState';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type JSX, type ReactNode, useContext } from 'react';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { Pill, TintedIconTile } from 'twenty-ui/data-display';
import { type IconComponent, type TablerIconsProps } from 'twenty-ui/icon';
import {
  AppTooltip,
  OverflowingTextWithTooltip,
  TooltipDelay,
  TooltipPosition,
} from 'twenty-ui/surfaces';
import { Label } from 'twenty-ui/typography';
import {
  MOBILE_VIEWPORT,
  ThemeContext,
  themeCssVariables,
} from 'twenty-ui/theme-constants';
import {
  type TriggerEventType,
  useMouseDownNavigation,
} from 'twenty-ui/utilities';
const DEFAULT_INDENTATION_LEVEL = 1;

export type NavigationDrawerItemIndentationLevel = 1 | 2;

export type NavigationDrawerItemModifier =
  | 'soon'
  | 'new'
  | { keyboard: string[] };

export type NavigationDrawerItemProps = {
  className?: string;
  label: string;
  secondaryLabel?: string;
  indentationLevel?: NavigationDrawerItemIndentationLevel;
  subItemState?: NavigationDrawerSubItemState;
  to?: string;
  onClick?: () => void;
  Icon?: IconComponent | ((props: TablerIconsProps) => JSX.Element);
  iconColor?: string | null;
  withIconBackground?: boolean;
  active?: boolean;
  modifier?: NavigationDrawerItemModifier;
  rightOptions?: ReactNode;
  alwaysShowRightOptions?: boolean;
  isDragging?: boolean;
  isRightOptionsDropdownOpen?: boolean;
  triggerEvent?: TriggerEventType;
  preventCollapseOnMobile?: boolean;
  isSelectedInEditMode?: boolean;
  variant?: 'default' | 'tertiary';
};

type StyledItemProps = Pick<
  NavigationDrawerItemProps,
  | 'active'
  | 'indentationLevel'
  | 'to'
  | 'isDragging'
  | 'isSelectedInEditMode'
  | 'variant'
> & {
  isSoon: boolean;
  isNavigationDrawerExpanded: boolean;
  hasRightOptions: boolean;
  href?: string;
  target?: string;
  rel?: string;
};

const StyledItem = styled.button<StyledItemProps>`
  align-items: center;
  background: ${({ active }) =>
    active
      ? `var(--t-nav-item-active-bg, ${themeCssVariables.background.transparent.light})`
      : 'transparent'};
  border: ${({ isSelectedInEditMode }) =>
    isSelectedInEditMode
      ? `1px solid ${themeCssVariables.color.blue}`
      : '1px solid transparent'};
  border-radius: var(
    --t-nav-item-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-shadow: ${({ active }) =>
    active ? 'var(--t-nav-item-active-indicator, none)' : 'none'};
  box-sizing: border-box;
  color: ${({ active, isSoon, variant }) => {
    if (variant === 'tertiary') {
      return themeCssVariables.font.color.tertiary;
    }
    if (active === true) {
      return `var(--t-nav-item-active-color, ${themeCssVariables.font.color.primary})`;
    }
    if (isSoon) {
      return themeCssVariables.font.color.light;
    }
    return `var(--t-nav-item-color, ${themeCssVariables.font.color.secondary})`;
  }};
  cursor: ${({ isSoon, isDragging }) =>
    isDragging ? 'grabbing' : isSoon ? 'default' : 'pointer'};
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${({ active }) =>
    active === true
      ? `var(
          --t-nav-item-active-font-weight,
          var(
            --t-nav-item-font-weight,
            ${themeCssVariables.font.weight.medium}
          )
        )`
      : `var(
          --t-nav-item-font-weight,
          ${themeCssVariables.font.weight.medium}
        )`};
  height: var(--t-nav-item-height, ${themeCssVariables.spacing[7]});
  margin-top: ${({ indentationLevel }) =>
    indentationLevel === 2 ? '2px' : '0'};
  justify-content: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? 'flex-start' : 'center'};
  min-width: 0;
  overflow: hidden;
  padding-bottom: var(--t-nav-item-padding-y, ${themeCssVariables.spacing[1]});
  padding-left: var(--t-nav-item-padding-x, ${themeCssVariables.spacing[1]});
  padding-right: ${({ hasRightOptions }) =>
    hasRightOptions === true
      ? `var(
        --t-nav-item-padding-right-with-options,
        ${themeCssVariables.spacing['0.5']}
      )`
      : `var(--t-nav-item-padding-x, ${themeCssVariables.spacing[1]})`};
  padding-top: var(--t-nav-item-padding-y, ${themeCssVariables.spacing[1]});
  pointer-events: ${({ isSoon }) => (isSoon ? 'none' : 'auto')};
  text-decoration: none;
  user-select: none;
  width: ${({ isNavigationDrawerExpanded, hasRightOptions }) =>
    !isNavigationDrawerExpanded
      ? '100%'
      : `var(--t-nav-item-width, calc(100% - ${themeCssVariables.spacing['1.5']} + ${themeCssVariables.spacing[1]} + ${hasRightOptions ? themeCssVariables.spacing['0.5'] : themeCssVariables.spacing[1]}))`};

  &:hover {
    background: ${({ active }) =>
      active === true
        ? `var(--t-nav-item-active-hover-bg, var(--t-nav-item-active-bg, ${themeCssVariables.background.transparent.light}))`
        : `var(--t-nav-item-hover-bg, ${themeCssVariables.background.transparent.light})`};
    color: ${({ active, variant }) => {
      if (variant === 'tertiary') {
        return themeCssVariables.font.color.tertiary;
      }
      if (active === true) {
        return `var(--t-nav-item-active-color, ${themeCssVariables.font.color.primary})`;
      }
      return `var(--t-nav-item-hover-color, ${themeCssVariables.font.color.primary})`;
    }};
  }

  &:hover .keyboard-shortcuts {
    visibility: visible;
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    height: ${themeCssVariables.spacing[8]};
  }
`;

const StyledItemElementsContainer = styled.div<{
  isNavigationDrawerExpanded: boolean;
}>`
  align-items: center;
  display: flex;
  justify-content: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? 'flex-start' : 'center'};
  width: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? '100%' : 'auto'};
`;

const StyledLabelParent = styled.div<{ isNavigationDrawerExpanded: boolean }>`
  align-items: center;
  display: flex;
  flex: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? '1 1 auto' : '0 0 0'};
  min-width: 0;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
  width: ${({ isNavigationDrawerExpanded }) =>
    isNavigationDrawerExpanded ? 'auto' : '0'};
`;

const StyledItemLabel = styled.span`
  font-weight: var(
    --t-nav-item-font-weight,
    ${themeCssVariables.font.weight.medium}
  );

  .navigation-drawer-item[aria-selected='true'] & {
    font-weight: var(
      --t-nav-item-active-font-weight,
      var(--t-nav-item-font-weight, ${themeCssVariables.font.weight.medium})
    );
  }
`;

const StyledItemSecondaryLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledKeyBoardShortcut = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};

  height: ${themeCssVariables.spacing[4]};
  justify-content: center;
  width: ${themeCssVariables.spacing[4]};
`;

const StyledNavigationDrawerItemContainer = styled.div`
  display: flex;
  width: 100%;
`;

const StyledSpacer = styled.span`
  flex-grow: 1;
`;

const StyledIcon = styled.div`
  --tinted-icon-tile-dimension: var(
    --t-nav-icon-tile-size,
    ${themeCssVariables.spacing[4]}
  );
  align-items: center;
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  justify-content: var(--t-nav-icon-justify, center);
  margin-right: var(--t-nav-item-icon-gap, ${themeCssVariables.spacing[2]});

  &[data-plain-icon='true'] {
    background: var(--t-nav-icon-tile-bg, transparent);
    border-radius: var(
      --t-nav-icon-tile-radius,
      ${themeCssVariables.border.radius.sm}
    );
    height: auto;
    min-height: var(--t-nav-icon-tile-size, auto);
    min-width: var(--t-nav-icon-tile-size, auto);
    width: auto;
  }

  svg {
    height: calc(var(--t-nav-icon-size, var(--t-icon-size-md)) * 1px);
    min-width: calc(var(--t-nav-icon-size, var(--t-icon-size-md)) * 1px);
    width: calc(var(--t-nav-icon-size, var(--t-icon-size-md)) * 1px);
  }
`;

const StyledIconBackgroundTile = styled.div`
  align-items: center;
  background-color: ${themeCssVariables.grayScale.gray3};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-shrink: 0;
  height: var(--t-nav-icon-tile-size, ${themeCssVariables.spacing[6]});
  justify-content: center;
  width: var(--t-nav-icon-tile-size, ${themeCssVariables.spacing[6]});
`;

const StyledRightOptionsContainer = styled.div`
  align-items: center;
  border-radius: var(
    --t-icon-button-radius,
    ${themeCssVariables.border.radius.sm}
  );
  color: var(--t-font-color-tertiary);
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  height: var(--t-nav-right-option-size, ${themeCssVariables.spacing[6]});
  justify-content: center;
  min-width: var(--t-nav-right-option-size, ${themeCssVariables.spacing[6]});
  width: auto;

  svg.tabler-icon {
    color: var(--t-font-color-tertiary);
    height: calc(var(--t-icon-size-md, 18) * 1px);
    stroke: currentColor;
    stroke-width: var(--t-icon-stroke-sm, 1.5);
    width: calc(var(--t-icon-size-md, 18) * 1px);
  }

  &:hover {
    background: var(
      --t-nav-right-option-hover-bg,
      var(--t-icon-button-hover-bg, transparent)
    );
  }

  .navigation-drawer-item[aria-selected='true'] & {
    &:hover {
      background: var(
        --t-nav-right-option-active-hover-bg,
        var(--t-nav-right-option-hover-bg, var(--t-icon-button-hover-bg, transparent))
      );
    }
  }
`;

const StyledRightOptionsVisbility = styled.div`
  clip-path: inset(1px);
  display: block;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  padding-left: ${themeCssVariables.spacing[2]};
  position: absolute;
  transition: opacity 150ms;
  white-space: nowrap;
  width: 1px;

  &[data-visible='true'],
  .navigation-drawer-item:hover & {
    clip-path: unset;
    display: flex;
    height: unset;
    opacity: 1;
    overflow: unset;
    position: unset;
    width: unset;
  }
`;

export const NavigationDrawerItem = ({
  className,
  label,
  secondaryLabel,
  indentationLevel = DEFAULT_INDENTATION_LEVEL,
  Icon,
  iconColor,
  withIconBackground = false,
  to,
  onClick,
  active,
  modifier,
  subItemState,
  rightOptions,
  alwaysShowRightOptions = false,
  isDragging,
  isRightOptionsDropdownOpen,
  triggerEvent,
  preventCollapseOnMobile = false,
  isSelectedInEditMode = false,
  variant = 'default',
}: NavigationDrawerItemProps) => {
  const { theme } = useContext(ThemeContext);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const hideIconTile = currentWorkspace?.uiTheme === 'enterprise';
  const isMobile = useIsMobile();
  const isExpanded = useNavigationDrawerExpanded();
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );

  const { navigationItemId } = useNavigationDrawerTooltip(label, to);

  const isSoon = modifier === 'soon';
  const isNew = modifier === 'new';
  const keyboardKeys =
    isDefined(modifier) && typeof modifier === 'object'
      ? modifier.keyboard
      : undefined;

  const showBreadcrumb = indentationLevel === 2;
  const showStyledSpacer = isDefined(modifier) || isDefined(rightOptions);

  const handleMobileNavigation = () => {
    if (isMobile && !preventCollapseOnMobile) {
      setIsNavigationDrawerExpanded(false);
    }
  };

  const isExternalLink =
    isDefined(to) && (to.startsWith('http://') || to.startsWith('https://'));
  const isInternalLink = isDefined(to) && !isExternalLink;

  const handleExternalLinkClick = () => {
    handleMobileNavigation();
    if (isDefined(to)) {
      window.open(to, '_blank', 'noopener,noreferrer');
    }
  };

  const {
    onClick: handleMouseDownNavigationClickClick,
    onMouseDown: handleMouseDown,
  } = useMouseDownNavigation({
    to: isExternalLink ? undefined : to,
    onClick: isExternalLink ? (onClick ?? handleExternalLinkClick) : onClick,
    onBeforeNavigation: handleMobileNavigation,
    triggerEvent,
  });

  const elementType = isExternalLink
    ? 'a'
    : isInternalLink
      ? Link
      : isDefined(rightOptions)
        ? 'div'
        : undefined;

  return (
    <StyledNavigationDrawerItemContainer>
      <StyledItem
        id={navigationItemId}
        className={`navigation-drawer-item ${className || ''}`}
        onClick={handleMouseDownNavigationClickClick}
        onMouseDown={handleMouseDown}
        active={active}
        aria-selected={active}
        isSoon={isSoon}
        variant={variant}
        indentationLevel={indentationLevel}
        isNavigationDrawerExpanded={isExpanded}
        isDragging={isDragging}
        hasRightOptions={isDefined(rightOptions)}
        isSelectedInEditMode={isSelectedInEditMode}
        as={elementType}
        role={!to && isDefined(rightOptions) ? 'button' : undefined}
        to={isInternalLink ? to : undefined}
        href={isExternalLink ? to : undefined}
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        draggable={isInternalLink ? false : undefined}
      >
        <StyledItemElementsContainer
          isNavigationDrawerExpanded={isExpanded}
        >
          {showBreadcrumb && (
            <NavigationDrawerAnimatedCollapseWrapper>
              <NavigationDrawerItemBreadcrumb state={subItemState} />
            </NavigationDrawerAnimatedCollapseWrapper>
          )}

          {Icon &&
            (isNonEmptyString(iconColor) && !hideIconTile ? (
              <StyledIcon>
                <TintedIconTile Icon={Icon} color={iconColor} />
              </StyledIcon>
            ) : withIconBackground && !hideIconTile ? (
              <StyledIcon>
                <StyledIconBackgroundTile>
                  <Icon
                    size={theme.icon.size.md}
                    stroke={theme.icon.stroke.md}
                    color={
                      showBreadcrumb && !isExpanded
                        ? theme.font.color.light
                        : 'currentColor'
                    }
                  />
                </StyledIconBackgroundTile>
              </StyledIcon>
            ) : (
              <StyledIcon data-plain-icon="true">
                <Icon
                  style={{
                    minWidth: theme.icon.size.md,
                  }}
                  size={theme.icon.size.md}
                  stroke={theme.icon.stroke.md}
                  color={
                    showBreadcrumb && !isExpanded
                      ? theme.font.color.light
                      : 'currentColor'
                  }
                />
              </StyledIcon>
            ))}

          <StyledLabelParent isNavigationDrawerExpanded={isExpanded}>
            <OverflowingTextWithTooltip
              text={
                <>
                  <StyledItemLabel>{label}</StyledItemLabel>
                  {secondaryLabel && (
                    <StyledItemSecondaryLabel>
                      {' · '}
                      {secondaryLabel}
                    </StyledItemSecondaryLabel>
                  )}
                </>
              }
              tooltipContent={
                secondaryLabel ? `${label} · ${secondaryLabel}` : label
              }
            />
          </StyledLabelParent>

          {showStyledSpacer && isExpanded && <StyledSpacer />}

          {isSoon && (
            <NavigationDrawerAnimatedCollapseWrapper>
              <Pill label={t`Soon`} />
            </NavigationDrawerAnimatedCollapseWrapper>
          )}

          {isNew && (
            <NavigationDrawerAnimatedCollapseWrapper>
              <Pill label={t`New`} />
            </NavigationDrawerAnimatedCollapseWrapper>
          )}

          {isDefined(keyboardKeys) && (
            <NavigationDrawerAnimatedCollapseWrapper>
              <StyledKeyBoardShortcut className="keyboard-shortcuts">
                <Label>{keyboardKeys}</Label>
              </StyledKeyBoardShortcut>
            </NavigationDrawerAnimatedCollapseWrapper>
          )}

          {isDefined(rightOptions) && (
            <NavigationDrawerAnimatedCollapseWrapper>
              {/* When StyledItem renders as a Link, we need both handlers to
                  prevent navigation when interacting with rightOptions:
                  - onMouseDown: stops useMouseDownNavigation from calling navigate()
                  - onClickCapture: prevents the native <a> follow since the child's
                    stopPropagation blocks Link's own preventDefault */}
              <StyledRightOptionsContainer
                data-nav-right-option="true"
                onMouseDown={(e) => e.stopPropagation()}
                onClickCapture={(e) => e.preventDefault()}
              >
                <StyledRightOptionsVisbility
                  data-visible={
                    isMobile ||
                    isRightOptionsDropdownOpen ||
                    alwaysShowRightOptions
                      ? 'true'
                      : undefined
                  }
                >
                  {rightOptions}
                </StyledRightOptionsVisbility>
              </StyledRightOptionsContainer>
            </NavigationDrawerAnimatedCollapseWrapper>
          )}
        </StyledItemElementsContainer>
      </StyledItem>

      {!isExpanded && !isMobile && (
        <AppTooltip
          anchorSelect={`#${navigationItemId}`}
          content={label}
          place={TooltipPosition.Right}
          delay={TooltipDelay.noDelay}
          positionStrategy="fixed"
        />
      )}
    </StyledNavigationDrawerItemContainer>
  );
};
