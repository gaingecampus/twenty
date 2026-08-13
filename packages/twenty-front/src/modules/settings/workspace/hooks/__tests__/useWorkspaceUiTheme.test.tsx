import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useWorkspaceUiTheme } from '@/settings/workspace/hooks/useWorkspaceUiTheme';
import { resetJotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { mockCurrentWorkspace } from '~/testing/mock-data/users';

const mockUpdateWorkspace = jest.fn();

jest.mock('@apollo/client/react', () => ({
  useMutation: () => [mockUpdateWorkspace],
}));

describe('useWorkspaceUiTheme', () => {
  it('should update the workspace ui theme', async () => {
    const store = resetJotaiStore();
    store.set(currentWorkspaceState.atom, mockCurrentWorkspace);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <JotaiProvider store={store}>{children}</JotaiProvider>
    );

    const { result } = renderHook(() => useWorkspaceUiTheme(), {
      wrapper: Wrapper,
    });

    expect(result.current.uiTheme).toBe('default');

    await act(async () => {
      await result.current.setUiTheme('enterprise');
    });

    expect(result.current.uiTheme).toBe('enterprise');
    expect(mockUpdateWorkspace).toHaveBeenCalledWith({
      variables: {
        input: {
          uiTheme: 'enterprise',
        },
      },
    });
  });
});
