import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useHasFieldsWidgetChanges } from '@/page-layout/hooks/useHasFieldsWidgetChanges';
import { pageLayoutDraftComponentState } from '@/page-layout/states/pageLayoutDraftComponentState';
import { pageLayoutPersistedComponentState } from '@/page-layout/states/pageLayoutPersistedComponentState';
import { getWidgetConfigurationViewId } from '@/page-layout/utils/getWidgetConfigurationViewId';
import { usePerformViewAPIPersist } from '@/views/hooks/internal/usePerformViewAPIPersist';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { useStore } from 'jotai';
import { useCallback, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { ViewType, WidgetType } from '~/generated-metadata/graphql';

export const useCreatePendingFieldsWidgetViews = () => {
  const { performViewAPICreate } = usePerformViewAPIPersist();
  const store = useStore();
  const { hasFieldsWidgetChanges } = useHasFieldsWidgetChanges();
  // Request cache only: retain successful creates when a later save step fails.
  // oxlint-disable-next-line twenty/no-state-useref
  const createdViewIds = useRef(new Set<string>());

  const createPendingFieldsWidgetViews = useCallback(
    async (pageLayoutId: string) => {
      const draft = store.get(
        pageLayoutDraftComponentState.atomFamily({
          instanceId: pageLayoutId,
        }),
      );
      const persisted = store.get(
        pageLayoutPersistedComponentState.atomFamily({
          instanceId: pageLayoutId,
        }),
      );

      const existingViewIds = new Set([
        ...store.get(viewsSelector.atom).map((view) => view.id),
        ...createdViewIds.current,
        ...(persisted?.tabs ?? []).flatMap((tab) =>
          tab.widgets.map((widget) =>
            getWidgetConfigurationViewId(widget.configuration),
          ),
        ),
      ]);
      const objectMetadataItems = store.get(objectMetadataItemsSelector.atom);
      const fieldsWidgets = draft.tabs
        .flatMap((tab) => tab.widgets)
        .filter((widget) => widget.type === WidgetType.FIELDS);

      for (const widget of fieldsWidgets) {
        const configuredViewId = getWidgetConfigurationViewId(
          widget.configuration,
        );
        if (
          isDefined(configuredViewId) &&
          existingViewIds.has(configuredViewId)
        ) {
          continue;
        }
        // Leave untouched legacy widgets on their existing fallback display.
        if (
          !isDefined(configuredViewId) &&
          !hasFieldsWidgetChanges(pageLayoutId)
        ) {
          continue;
        }
        const viewId = configuredViewId ?? v4();

        const objectMetadataId =
          widget.objectMetadataId ?? draft.objectMetadataId;

        if (!isDefined(objectMetadataId)) {
          throw new Error(
            `Missing object metadata for FIELDS widget ${widget.id}`,
          );
        }

        const objectMetadataItem = objectMetadataItems.find(
          (item) => item.id === objectMetadataId,
        );

        const viewName = isDefined(objectMetadataItem)
          ? `${objectMetadataItem.labelSingular} Fields`
          : 'Fields';

        const result = await performViewAPICreate(
          {
            input: {
              id: viewId,
              name: viewName,
              icon: 'IconList',
              objectMetadataId,
              type: ViewType.FIELDS_WIDGET,
            },
          },
          objectMetadataId,
        );

        if (result.status === 'failed') {
          throw new Error(
            `Failed to create view for FIELDS widget ${widget.id}`,
          );
        }

        createdViewIds.current.add(viewId);
        existingViewIds.add(viewId);
        // Legacy widgets have no view until their first customization is saved.
        if (!isDefined(configuredViewId)) {
          store.set(
            pageLayoutDraftComponentState.atomFamily({
              instanceId: pageLayoutId,
            }),
            (current) => ({
              ...current,
              tabs: current.tabs.map((tab) => ({
                ...tab,
                widgets: tab.widgets.map((item) =>
                  item.id === widget.id
                    ? {
                        ...item,
                        configuration: { ...item.configuration, viewId },
                      }
                    : item,
                ),
              })),
            }),
          );
        }
      }
    },
    [performViewAPICreate, store, hasFieldsWidgetChanges],
  );

  return { createPendingFieldsWidgetViews };
};
