import { RecordIndexPageProvider } from '@/object-record/record-index/components/RecordIndexPageProvider';
import { isRecordIndexInlineEditModeEnabledState } from '@/object-record/record-index/states/isRecordIndexInlineEditModeEnabledState';
import { useIsRecordTableCheckboxColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableCheckboxColumnHidden';
import { RecordTableComponentInstanceContext } from '@/object-record/record-table/states/context/RecordTableComponentInstanceContext';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar');

(useSnackBar as jest.Mock).mockReturnValue({
  enqueueInfoSnackBar: jest.fn(),
});

const RECORD_TABLE_ID = 'record-table';

describe('useIsRecordTableCheckboxColumnHidden', () => {
  it('should keep the checkbox column visible outside a record index page', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RecordTableComponentInstanceContext.Provider
        value={{ instanceId: RECORD_TABLE_ID }}
      >
        {children}
      </RecordTableComponentInstanceContext.Provider>
    );

    const { result } = renderHook(
      () => useIsRecordTableCheckboxColumnHidden(),
      { wrapper },
    );

    expect(result.current).toBe(false);
  });

  it('should hide the checkbox column when record index edit mode is off', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, false);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>
          <RecordTableComponentInstanceContext.Provider
            value={{ instanceId: RECORD_TABLE_ID }}
          >
            {children}
          </RecordTableComponentInstanceContext.Provider>
        </RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(
      () => useIsRecordTableCheckboxColumnHidden(),
      { wrapper },
    );

    expect(result.current).toBe(true);
  });

  it('should show the checkbox column when record index edit mode is on', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, true);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>
          <RecordTableComponentInstanceContext.Provider
            value={{ instanceId: RECORD_TABLE_ID }}
          >
            {children}
          </RecordTableComponentInstanceContext.Provider>
        </RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(
      () => useIsRecordTableCheckboxColumnHidden(),
      { wrapper },
    );

    expect(result.current).toBe(false);
  });
});
