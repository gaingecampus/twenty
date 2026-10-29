import { act, render } from '@testing-library/react';
import { RecordIndexRelationRollupFetchEffect } from '@/object-record/relation-rollup/components/RecordIndexRelationRollupFetchEffect';

let mockViewId: string | null = 'first-view';
const mockRecordIds = ['record'];
const mockRecord = { id: 'record' };
const mockStore = { get: jest.fn(() => mockRecord) };
const mockFetch = jest.fn();
const mockGetView = jest.fn(() => ({ viewFields: [{ relationRollup: {} }] }));

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useStore: () => mockStore,
}));
jest.mock('@/object-record/record-index/contexts/RecordIndexContext', () => ({
  useRecordIndexContextOrThrow: () => ({
    objectNameSingular: 'company',
    recordIndexId: 'index',
  }),
}));
jest.mock('@/views/hooks/useGetViewFromState', () => ({
  useGetViewFromState: () => ({ getViewFromState: mockGetView }),
}));
jest.mock(
  '@/object-record/relation-rollup/hooks/useFetchRelationRollupAggregates',
  () => ({
    useFetchRelationRollupAggregates: () => ({
      fetchRelationRollupAggregates: mockFetch,
    }),
  }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue',
  () => ({
    useAtomComponentStateValue: () => mockViewId,
  }),
);
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue',
  () => ({
    useAtomComponentSelectorValue: () => mockRecordIds,
  }),
);

describe('RecordIndexRelationRollupFetchEffect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockViewId = 'first-view';
  });
  afterEach(() => jest.useRealTimers());

  it('fetches on initial render and on view changes even when record IDs are unchanged', async () => {
    const { rerender, unmount } = render(
      <RecordIndexRelationRollupFetchEffect />,
    );
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockFetch).toHaveBeenCalledWith([mockRecord]);
    mockViewId = 'second-view';
    rerender(<RecordIndexRelationRollupFetchEffect />);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockGetView).toHaveBeenLastCalledWith('second-view');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('cancels a pending fetch on unmount', async () => {
    const { unmount } = render(<RecordIndexRelationRollupFetchEffect />);
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
