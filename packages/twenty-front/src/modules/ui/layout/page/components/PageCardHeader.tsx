import { useNavigationDrawerExpanded } from '@/navigation/hooks/useNavigationDrawerExpanded';
import { SIDE_PANEL_TOP_BAR_HEIGHT } from '@/side-panel/constants/SidePanelTopBarHeight';
import {
  Breadcrumb,
  type BreadcrumbProps,
} from '@/ui/navigation/bread-crumb/components/Breadcrumb';
import { PAGE_ACTION_CONTAINER_CLICK_OUTSIDE_ID } from '@/ui/layout/page/constants/PageActionContainerClickOutsideId';
import { NavigationDrawerCollapseButton } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerCollapseButton';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type PageCardHeaderProps = {
  links?: BreadcrumbProps['links'];
  breadcrumb?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
  tag?: ReactNode;
  actionButton?: ReactNode;
  centerContent?: ReactNode;
  centerTitle?: boolean;
  titleColor?: string;
};

type HeaderLayout = 'default' | 'centerTitle' | 'centerContent';

const StyledHeader = styled.div<{ headerLayout: HeaderLayout }>`
  align-items: center;
  background-color: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  column-gap: ${themeCssVariables.spacing[2]};
  display: grid;
  /* Balanced side columns keep center content truly centered; right 1fr
     also gives pinned command buttons room to measure and render. */
  grid-template-columns: ${({ headerLayout }) => {
    if (headerLayout === 'centerTitle' || headerLayout === 'centerContent') {
      return 'minmax(0, 1fr) auto minmax(0, 1fr)';
    }

    return 'minmax(0, auto) minmax(0, 1fr)';
  }};
  min-height: ${SIDE_PANEL_TOP_BAR_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledLeft = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  grid-column: 1;
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledTitle = styled.div<{ titleColor?: string }>`
  align-items: center;
  color: ${({ titleColor }) =>
    titleColor ?? themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledCenteredTitle = styled(StyledTitle)`
  grid-column: 2;
  justify-content: center;
  justify-self: center;
  max-width: 100%;
  overflow: hidden;
`;

const StyledCenterContent = styled.div`
  align-items: center;
  display: flex;
  grid-column: 2;
  justify-content: center;
  justify-self: center;
  max-width: 100%;
  min-width: 0;
`;

const StyledRight = styled.div<{ headerLayout: HeaderLayout }>`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  grid-column: ${({ headerLayout }) =>
    headerLayout === 'default' ? 2 : 3};
  justify-content: flex-end;
  justify-self: end;
  min-width: 0;
  width: 100%;
`;

export const PageCardHeader = ({
  links,
  breadcrumb,
  icon,
  title,
  tag,
  actionButton,
  centerContent,
  centerTitle = false,
  titleColor,
}: PageCardHeaderProps) => {
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useNavigationDrawerExpanded();

  const hasTitleContent =
    !isMobile && (isDefined(icon) || isDefined(title) || isDefined(tag));
  const shouldCenterTitle = centerTitle && hasTitleContent && !centerContent;
  const hasCenterContent = isDefined(centerContent);

  const headerLayout: HeaderLayout = shouldCenterTitle
    ? 'centerTitle'
    : hasCenterContent
      ? 'centerContent'
      : 'default';

  const titleContent = (
    <>
      {icon}
      {isDefined(title) && title}
      {tag}
    </>
  );

  return (
    <StyledHeader headerLayout={headerLayout}>
      <StyledLeft>
        {!isNavigationDrawerExpanded && (
          <NavigationDrawerCollapseButton direction="right" />
        )}
        {isDefined(breadcrumb)
          ? breadcrumb
          : isDefined(links) && <Breadcrumb links={links} />}
        {!shouldCenterTitle && hasTitleContent && (
          <StyledTitle titleColor={titleColor}>{titleContent}</StyledTitle>
        )}
      </StyledLeft>
      {shouldCenterTitle && (
        <StyledCenteredTitle titleColor={titleColor}>
          {titleContent}
        </StyledCenteredTitle>
      )}
      {hasCenterContent && (
        <StyledCenterContent>{centerContent}</StyledCenterContent>
      )}
      <StyledRight
        headerLayout={headerLayout}
        data-click-outside-id={PAGE_ACTION_CONTAINER_CLICK_OUTSIDE_ID}
      >
        {actionButton}
      </StyledRight>
    </StyledHeader>
  );
};
