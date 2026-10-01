import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { renderHook } from '@testing-library/react';
import { type DropResult } from '@hello-pangea/dnd';
import { useReorderPageLayoutTabs } from '@/page-layout/hooks/useReorderPageLayoutTabs';

const mockSetDraft = jest.fn();
const mockTabs = [
  { id: 'first', position: 0, isActive: true },
  { id: 'last', position: 2, isActive: true },
];
jest.mock('@/page-layout/hooks/useCurrentPageLayout', () => ({
  useCurrentPageLayout: () => ({ currentPageLayout: { tabs: mockTabs } }),
}));
jest.mock('@/page-layout/hooks/usePageLayoutDraftState', () => ({
  usePageLayoutDraftState: () => ({ setPageLayoutDraft: mockSetDraft }),
}));
jest.mock(
  '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow',
  () => ({
    useAvailableComponentInstanceIdOrThrow: () => 'layout',
  }),
);

describe('additional layout tabs', () => {
  beforeEach(() => mockSetDraft.mockClear());
  it('includes the built-in tab in the saved draft at the dropped position', () => {
    const additionalTab = { id: 'built-in', position: 1, isActive: true };
    const { result } = renderHook(() =>
      useReorderPageLayoutTabs('layout', [additionalTab as PageLayoutTab]),
    );
    result.current.reorderTabs({
      draggableId: 'built-in',
      source: { droppableId: 'tabs', index: 1 },
      destination: { droppableId: 'tabs', index: 0 },
    } as DropResult);
    const draft = mockSetDraft.mock.calls[0][0]({ tabs: mockTabs });
    expect(draft.tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'built-in', position: 0 }),
        expect.objectContaining({ id: 'first', position: 1 }),
        expect.objectContaining({ id: 'last', position: 2 }),
      ]),
    );
    expect(mockTabs).toHaveLength(2);
  });
});
