import { type JSX, createContext } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { DEFAULT_UI_THEME_ID, isUiThemeId } from 'twenty-shared/constants';
import { type ColorScheme } from 'twenty-ui/input';
import { ThemeProvider } from 'twenty-ui/theme-constants';

type BaseThemeProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const ThemeSchemeContext = createContext<(theme: ColorScheme) => void>(
  () => {},
);

export const BaseThemeProvider = ({ children }: BaseThemeProviderProps) => {
  const [persistedColorScheme, setPersistedColorScheme] = useAtomState(
    persistedColorSchemeState,
  );
  const systemColorScheme = useSystemColorScheme();
  const effectiveColorScheme =
    persistedColorScheme === 'System'
      ? systemColorScheme
      : persistedColorScheme;
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const uiTheme = isUiThemeId(currentWorkspace?.uiTheme)
    ? currentWorkspace.uiTheme
    : DEFAULT_UI_THEME_ID;

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider
        colorScheme={effectiveColorScheme === 'Dark' ? 'dark' : 'light'}
        uiTheme={uiTheme}
      >
        {children}
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
