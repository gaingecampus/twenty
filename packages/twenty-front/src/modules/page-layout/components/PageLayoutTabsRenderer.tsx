import { FieldManagement } from '@/field-management/FieldManagement';
import {
  FIELD_MANAGEMENT_RECORD_TAB_ID,
  useFieldManagementRecordTab,
} from '@/field-management/useFieldManagementRecordTab';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { type FlatObjectMetadataItem } from '@/metadata-store/types/FlatObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { DashboardPageLayoutFilterBar } from '@/page-layout/components/DashboardPageLayoutFilterBar';
import { PageLayoutLeftPanel } from '@/page-layout/components/PageLayoutLeftPanel';
import { PageLayoutTabList } from '@/page-layout/components/PageLayoutTabList';
import { PageLayoutTabListEffect } from '@/page-layout/components/PageLayoutTabListEffect';
import { DEFAULT_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultRecordPageLayoutId';
import { PAGE_LAYOUT_LEFT_PANEL_CONTAINER_WIDTH } from '@/page-layout/constants/PageLayoutLeftPanelContainerWidth';
import { WIDGET_TYPE_TO_RELATION_FIELD_NAME } from '@/page-layout/constants/WidgetTypeToRelationFieldName';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { usePageLayoutAddTabStrategy } from '@/page-layout/hooks/usePageLayoutAddTabStrategy';
import { useReorderRecordPageLayoutTabs } from '@/page-layout/hooks/useReorderRecordPageLayoutTabs';
import { PageLayoutMainContent } from '@/page-layout/PageLayoutMainContent';
import { getScrollWrapperInstanceIdFromPageLayoutId } from '@/page-layout/utils/getScrollWrapperInstanceIdFromPageLayoutId';
import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { getTabsByDisplayMode } from '@/page-layout/utils/getTabsByDisplayMode';
import { getTabsWithVisibleWidgets } from '@/page-layout/utils/getTabsWithVisibleWidgets';
import { shouldEnableTabEditingFeatures } from '@/page-layout/utils/shouldEnableTabEditingFeatures';
import { sortTabsByPosition } from '@/page-layout/utils/sortTabsByPosition';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useRef, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useIsMobile } from 'twenty-ui/utilities';
import { PageLayoutType, WidgetType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div<{
  hasPinnedTab: boolean;
  panelWidth: number;
}>`
  display: grid;
  grid-template-columns: ${({ hasPinnedTab, panelWidth }) =>
    hasPinnedTab ? `min(${panelWidth}px, 60%) 0px minmax(0, 1fr)` : '1fr'};
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  width: 100%;

  @media print {
    display: block;
    height: auto;
    width: 100%;
  }
`;

const StyledResizeHandle = styled.div`
  cursor: col-resize;
  margin-inline: -4px;
  position: relative;
  touch-action: none;
  width: 8px;
  z-index: 2;

  &::before {
    background: ${themeCssVariables.color.blue};
    bottom: 0;
    content: '';
    left: 3px;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 2px;
  }

  &:hover::before,
  &:focus-visible::before,
  &[data-resizing='true']::before {
    opacity: 1;
  }

  @media print {
    display: none;
  }
`;

const StyledTabsAndDashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media print {
    display: block;
    overflow: visible;

    .page-layout-tab-list-print-hidden {
      display: none;
    }
  }
`;

const StyledScrollWrapperContainer = styled.div`
  flex: 1;
  min-height: 0;

  @media print {
    min-height: auto;

    .page-layout-scroll-wrapper {
      height: auto;
      overflow: visible;
    }
  }
`;

export const PageLayoutTabsRenderer = () => {
  const { t } = useLingui();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(
    PAGE_LAYOUT_LEFT_PANEL_CONTAINER_WIDTH,
  );
  const resizePanel = (width: number) => {
    const maximum = Math.max(
      260,
      Math.min(600, (containerRef.current?.clientWidth ?? 1000) * 0.6),
    );
    setPanelWidth(Math.max(260, Math.min(maximum, width)));
  };
  const { currentPageLayout } = useCurrentPageLayoutOrThrow();

  const { isInSidePanel, layoutType, targetRecordIdentifier } =
    useLayoutRenderingContext();

  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();

  const activeTabId = useAtomComponentStateValue(activeTabIdComponentState);

  const tabListInstanceId = getTabListInstanceIdFromPageLayoutAndRecord({
    pageLayoutId: currentPageLayout.id,
    layoutType,
    targetRecordIdentifier,
  });

  const addTabStrategy = usePageLayoutAddTabStrategy({
    pageLayoutId: currentPageLayout.id,
    tabListInstanceId,
  });

  const { objectMetadataItems } = useObjectMetadataItems();

  const inactiveRelationFieldNames = useMemo(() => {
    if (!isDefined(targetRecordIdentifier)) {
      return new Set<string>();
    }

    const objectMetadataItem = objectMetadataItems.find(
      (item) =>
        item.nameSingular === targetRecordIdentifier.targetObjectNameSingular,
    );

    if (!isDefined(objectMetadataItem)) {
      return new Set<string>();
    }

    return new Set(
      objectMetadataItem.fields
        .filter(
          (field) =>
            !field.isActive &&
            (field.type === FieldMetadataType.RELATION ||
              field.type === FieldMetadataType.MORPH_RELATION),
        )
        .map((field) => field.name),
    );
  }, [objectMetadataItems, targetRecordIdentifier]);

  const isMobile = useIsMobile();

  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );

  const isSystemObject =
    (metadataStore.current as FlatObjectMetadataItem[]).find(
      (item) =>
        item.nameSingular === targetRecordIdentifier?.targetObjectNameSingular,
    )?.isSystem ?? false;

  const canEnableTabEditing =
    isPageLayoutInEditMode &&
    shouldEnableTabEditingFeatures(currentPageLayout.type);

  const fieldManagementTab = useFieldManagementRecordTab(currentPageLayout.id);

  const tabsWithVisibleWidgets = getTabsWithVisibleWidgets({
    tabs: currentPageLayout.tabs,
    contentTabIds: fieldManagementTab ? [fieldManagementTab.id] : [],
    isMobile,
    isInSidePanel,
    isEditMode: isPageLayoutInEditMode,
  });

  const SYSTEM_OBJECT_TABS = ['Home', 'Timeline', 'Overview', 'Flow'];

  const isUsingDefaultRecordPageLayout =
    currentPageLayout.id === DEFAULT_RECORD_PAGE_LAYOUT_ID;

  const tabsForCurrentObject =
    isSystemObject && isUsingDefaultRecordPageLayout
      ? tabsWithVisibleWidgets.filter((tab) =>
          SYSTEM_OBJECT_TABS.includes(tab.title),
        )
      : tabsWithVisibleWidgets;

  const { tabsToRenderInTabList, pinnedLeftTab } = getTabsByDisplayMode({
    tabs: tabsForCurrentObject,
    pageLayoutType: currentPageLayout.type,
    isMobile,
    isInSidePanel,
  });

  const sortedTabs = sortTabsByPosition(tabsToRenderInTabList);

  const sortedActiveTabs = useMemo(
    () =>
      sortedTabs.filter((tab) => {
        const widgetTypes = tab.widgets.map((widget) => widget.type);
        return !widgetTypes.some((widgetType) => {
          const relationFieldName =
            WIDGET_TYPE_TO_RELATION_FIELD_NAME[widgetType];
          return (
            isDefined(relationFieldName) &&
            inactiveRelationFieldNames.has(relationFieldName)
          );
        });
      }),
    [sortedTabs, inactiveRelationFieldNames],
  );

  const savedFieldManagementTab = currentPageLayout.tabs.find(
    (tab) => tab.id === fieldManagementTab?.id,
  );
  const additionalFieldManagementTab =
    fieldManagementTab && !savedFieldManagementTab
      ? {
          ...fieldManagementTab,
          position:
            sortedActiveTabs.length > 1
              ? (sortedActiveTabs[0].position + sortedActiveTabs[1].position) /
                2
              : (sortedActiveTabs[0]?.position ?? -1) + 1,
        }
      : undefined;
  const tabsWithFieldManagement = additionalFieldManagementTab
    ? [
        ...sortedActiveTabs.slice(0, 1),
        additionalFieldManagementTab,
        ...sortedActiveTabs.slice(1),
      ]
    : sortedActiveTabs;
  const { reorderRecordPageTabs } = useReorderRecordPageLayoutTabs(
    currentPageLayout.id,
    additionalFieldManagementTab ? [additionalFieldManagementTab] : [],
  );
  const displayTabs = tabsWithFieldManagement.map((tab) => {
    if (fieldManagementTab && tab.id === fieldManagementTab.id) {
      return { ...tab, icon: fieldManagementTab.icon };
    }

    const isNoteContentTab =
      targetRecordIdentifier?.targetObjectNameSingular ===
        CoreObjectNameSingular.Note &&
      ['Note', 'Notes', '노트'].includes(tab.title) &&
      tab.widgets.some((widget) => widget.type === WidgetType.FIELD_RICH_TEXT);

    return isNoteContentTab ? { ...tab, title: t`Content` } : tab;
  });
  const isFieldManagementTabActive =
    !!fieldManagementTab &&
    (activeTabId === fieldManagementTab.id ||
      activeTabId === FIELD_MANAGEMENT_RECORD_TAB_ID);

  const activeTabExistsInCurrentPageLayout = currentPageLayout.tabs.some(
    (tab) => tab.id === activeTabId,
  );

  return (
    <StyledContainer
      ref={containerRef}
      hasPinnedTab={isDefined(pinnedLeftTab)}
      panelWidth={panelWidth}
    >
      {isDefined(pinnedLeftTab) && (
        <>
          <PageLayoutLeftPanel pinnedLeftTabId={pinnedLeftTab.id} />
          <StyledResizeHandle
            role="separator"
            aria-label={t`Resize`}
            aria-orientation="vertical"
            aria-valuenow={panelWidth}
            aria-valuemin={260}
            aria-valuemax={600}
            tabIndex={0}
            data-resizing={isResizing}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setIsResizing(true);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId))
                return;
              const bounds = containerRef.current?.getBoundingClientRect();
              if (bounds) resizePanel(event.clientX - bounds.left);
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onLostPointerCapture={() => setIsResizing(false)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                resizePanel(
                  panelWidth + (event.key === 'ArrowRight' ? 16 : -16),
                );
              }
            }}
            onDoubleClick={() =>
              setPanelWidth(PAGE_LAYOUT_LEFT_PANEL_CONTAINER_WIDTH)
            }
          />
        </>
      )}

      <StyledTabsAndDashboardContainer>
        <PageLayoutTabListEffect
          tabs={displayTabs}
          componentInstanceId={tabListInstanceId}
          defaultTabToFocusOnMobileAndSidePanelId={
            currentPageLayout.defaultTabToFocusOnMobileAndSidePanelId ??
            undefined
          }
        />
        {(displayTabs.length > 1 || isPageLayoutInEditMode) && (
          <PageLayoutTabList
            className="page-layout-tab-list-print-hidden"
            tabs={displayTabs}
            behaveAsLinks={!isInSidePanel && !isPageLayoutInEditMode}
            isInSidePanel={isInSidePanel}
            componentInstanceId={tabListInstanceId}
            addTabStrategy={addTabStrategy}
            isReorderEnabled={canEnableTabEditing}
            onReorder={
              canEnableTabEditing
                ? (result, provided) =>
                    reorderRecordPageTabs(
                      result,
                      provided,
                      isDefined(pinnedLeftTab),
                    )
                : undefined
            }
            pageLayoutType={currentPageLayout.type}
          />
        )}

        {layoutType === PageLayoutType.DASHBOARD && (
          <DashboardPageLayoutFilterBar />
        )}

        <StyledScrollWrapperContainer>
          <ScrollWrapper
            className="page-layout-scroll-wrapper"
            componentInstanceId={getScrollWrapperInstanceIdFromPageLayoutId(
              currentPageLayout.id,
            )}
            defaultEnableXScroll={false}
          >
            {isFieldManagementTabActive && targetRecordIdentifier ? (
              <FieldManagement
                key={targetRecordIdentifier.id}
                scope={
                  targetRecordIdentifier.targetObjectNameSingular === 'company'
                    ? { company: targetRecordIdentifier.id }
                    : { contract: targetRecordIdentifier.id }
                }
              />
            ) : isDefined(activeTabId) && activeTabExistsInCurrentPageLayout ? (
              <PageLayoutMainContent tabId={activeTabId} />
            ) : null}
          </ScrollWrapper>
        </StyledScrollWrapperContainer>
      </StyledTabsAndDashboardContainer>
    </StyledContainer>
  );
};
