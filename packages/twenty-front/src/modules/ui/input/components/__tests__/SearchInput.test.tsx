import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';

import { SearchInput } from '@/ui/input/components/SearchInput';
import { focusStackState } from '@/ui/utilities/focus/states/focusStackState';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { ThemeProvider } from 'twenty-ui/theme-constants';

describe('SearchInput', () => {
  it('pushes a focus stack item that disables conflicting hotkeys on focus', () => {
    const store = createStore();
    const instanceId = 'test-search-input-id';

    render(
      <JotaiProvider store={store}>
        <ThemeProvider colorScheme="light">
          <SearchInput
            instanceId={instanceId}
            value=""
            onChange={() => undefined}
            placeholder="Search"
          />
        </ThemeProvider>
      </JotaiProvider>,
    );

    fireEvent.focus(screen.getByRole('textbox'));

    expect(store.get(focusStackState.atom).at(-1)).toMatchObject({
      focusId: instanceId,
      componentInstance: {
        componentType: FocusComponentType.TEXT_INPUT,
        componentInstanceId: instanceId,
      },
      globalHotkeysConfig: {
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  });

  it('removes the focus stack item on blur', () => {
    const store = createStore();
    const instanceId = 'test-search-input-id';

    render(
      <JotaiProvider store={store}>
        <ThemeProvider colorScheme="light">
          <SearchInput
            instanceId={instanceId}
            value=""
            onChange={() => undefined}
            placeholder="Search"
          />
        </ThemeProvider>
      </JotaiProvider>,
    );

    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(
      store
        .get(focusStackState.atom)
        .find((focusStackItem) => focusStackItem.focusId === instanceId),
    ).toBeUndefined();
  });
});
