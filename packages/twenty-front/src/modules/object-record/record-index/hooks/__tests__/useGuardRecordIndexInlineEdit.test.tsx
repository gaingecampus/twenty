import { RecordIndexPageProvider } from '@/object-record/record-index/components/RecordIndexPageProvider';
import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { isRecordIndexInlineEditModeEnabledState } from '@/object-record/record-index/states/isRecordIndexInlineEditModeEnabledState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar');

const mockEnqueueInfoSnackBar = jest.fn();

(useSnackBar as jest.Mock).mockReturnValue({
  enqueueInfoSnackBar: mockEnqueueInfoSnackBar,
});

describe('useGuardRecordIndexInlineEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow inline edit when not on a record index page', () => {
    const { result } = renderHook(() => useGuardRecordIndexInlineEdit());

    expect(result.current.isInlineEditEnabled).toBe(true);
    expect(result.current.assertInlineEditAllowed()).toBe(true);
    expect(mockEnqueueInfoSnackBar).not.toHaveBeenCalled();
  });

  it('should block inline edit and show a snackbar when edit mode is off', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, false);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>{children}</RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(() => useGuardRecordIndexInlineEdit(), {
      wrapper,
    });

    expect(result.current.isInlineEditEnabled).toBe(false);
    expect(result.current.assertInlineEditAllowed()).toBe(false);
    expect(mockEnqueueInfoSnackBar).toHaveBeenCalledTimes(1);
    expect(mockEnqueueInfoSnackBar).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          dedupeKey: 'record-index-inline-edit-disabled',
        }),
      }),
    );
  });

  it('should allow inline edit when edit mode is on', () => {
    const store = createStore();
    store.set(isRecordIndexInlineEditModeEnabledState.atom, true);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>
        <RecordIndexPageProvider>{children}</RecordIndexPageProvider>
      </JotaiProvider>
    );

    const { result } = renderHook(() => useGuardRecordIndexInlineEdit(), {
      wrapper,
    });

    expect(result.current.isInlineEditEnabled).toBe(true);
    expect(result.current.assertInlineEditAllowed()).toBe(true);
    expect(mockEnqueueInfoSnackBar).not.toHaveBeenCalled();
  });
});
