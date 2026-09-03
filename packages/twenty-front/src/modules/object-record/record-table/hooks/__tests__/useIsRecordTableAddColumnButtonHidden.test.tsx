import { RecordIndexPageProvider } from '@/object-record/record-index/components/RecordIndexPageProvider';
import { isRecordIndexInlineEditModeEnabledState } from '@/object-record/record-index/states/isRecordIndexInlineEditModeEnabledState';
import { useIsRecordTableAddColumnButtonHidden } from '@/object-record/record-table/hooks/useIsRecordTableAddColumnButtonHidden';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar');

(useSnackBar as jest.Mock).mockReturnValue({
  enqueueInfoSnackBar: jest.fn(),
});

describe('useIsRecordTableAddColumnButtonHidden', () => {
  it('should keep the add column button visible outside a record index page', () => {
    const { result } = renderHook(() =>
      useIsRecordTableAddColumnButtonHidden(),
    );

    expect(result.current).toBe(false);
  });

  it('should hide the add column button when record index edit mode is off', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, false);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>{children}</RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(
      () => useIsRecordTableAddColumnButtonHidden(),
      { wrapper },
    );

    expect(result.current).toBe(true);
  });

  it('should show the add column button when record index edit mode is on', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, true);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>{children}</RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(
      () => useIsRecordTableAddColumnButtonHidden(),
      { wrapper },
    );

    expect(result.current).toBe(false);
  });
});
