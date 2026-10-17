import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { type ReactNode } from 'react';
import { pageLayoutDraftComponentState } from '@/page-layout/states/pageLayoutDraftComponentState';
import { useCreatePendingFieldsWidgetViews } from '@/page-layout/hooks/useCreatePendingFieldsWidgetViews';
import { createDefaultFieldsWidget } from '@/page-layout/utils/createDefaultFieldsWidget';
import {
  PageLayoutType,
  PageLayoutTabLayoutMode,
} from '~/generated-metadata/graphql';

const mockCreate = jest.fn();
const mockHasChanges = jest.fn();
jest.mock('@/page-layout/hooks/useHasFieldsWidgetChanges', () => ({
  useHasFieldsWidgetChanges: () => ({ hasFieldsWidgetChanges: mockHasChanges }),
}));
jest.mock('@/views/hooks/internal/usePerformViewAPIPersist', () => ({
  usePerformViewAPIPersist: () => ({ performViewAPICreate: mockCreate }),
}));

const setup = (viewId: string | null) => {
  const store = createStore();
  const atom = pageLayoutDraftComponentState.atomFamily({
    instanceId: 'layout',
  });
  const widget = createDefaultFieldsWidget({
    id: 'widget',
    pageLayoutTabId: 'tab',
    viewId: 'pending-view',
    objectMetadataId: 'object',
    positionIndex: 0,
  });
  store.set(atom, {
    id: 'layout',
    name: 'Layout',
    type: PageLayoutType.RECORD_PAGE,
    objectMetadataId: 'object',
    defaultTabToFocusOnMobileAndSidePanelId: null,
    filters: null,
    tabs: [
      {
        id: 'tab',
        applicationId: 'application',
        isActive: true,
        createdAt: '2026-10-17T00:00:00Z',
        updatedAt: '2026-10-17T00:00:00Z',
        title: 'Home',
        position: 0,
        pageLayoutId: 'layout',
        layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
        widgets: [
          { ...widget, configuration: { ...widget.configuration, viewId } },
        ],
      },
    ],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return {
    ...renderHook(useCreatePendingFieldsWidgetViews, { wrapper }),
    store,
    atom,
  };
};

describe('fields widget view preparation', () => {
  beforeEach(() => {
    mockHasChanges.mockReturnValue(true);
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ status: 'successful' });
  });

  it('preserves untouched legacy fallback fields during unrelated layout edits', async () => {
    mockHasChanges.mockReturnValue(false);
    const { result } = setup(null);
    await result.current.createPendingFieldsWidgetViews('layout');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('connects a legacy widget and reuses the view on save retry', async () => {
    const { result, store, atom } = setup(null);
    await result.current.createPendingFieldsWidgetViews('layout');
    const viewId = mockCreate.mock.calls[0][0].input.id;
    expect(store.get(atom).tabs[0].widgets[0].configuration).toHaveProperty(
      'viewId',
      viewId,
    );
    await result.current.createPendingFieldsWidgetViews('layout');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('keeps the original draft when view creation fails and permits retry', async () => {
    mockCreate.mockResolvedValueOnce({ status: 'failed' });
    const { result, store, atom } = setup(null);
    await expect(
      result.current.createPendingFieldsWidgetViews('layout'),
    ).rejects.toThrow('Failed to create view');
    expect(store.get(atom).tabs[0].widgets[0].configuration).toHaveProperty(
      'viewId',
      null,
    );
    await result.current.createPendingFieldsWidgetViews('layout');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('does not recreate a new widget view after a later layout save fails', async () => {
    const { result } = setup('pending-view');
    await result.current.createPendingFieldsWidgetViews('layout');
    await result.current.createPendingFieldsWidgetViews('layout');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].input.id).toBe('pending-view');
  });
});
