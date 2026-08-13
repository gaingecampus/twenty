import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import {
  DEFAULT_UI_THEME_ID,
  isUiThemeId,
  type UiThemeId,
} from 'twenty-shared/constants';
import { UpdateWorkspaceDocument } from '~/generated-metadata/graphql';
import { logError } from '~/utils/logError';

export const useWorkspaceUiTheme = () => {
  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );
  const [updateWorkspace] = useMutation(UpdateWorkspaceDocument);

  const uiTheme = isUiThemeId(currentWorkspace?.uiTheme)
    ? currentWorkspace.uiTheme
    : DEFAULT_UI_THEME_ID;

  const setUiTheme = useCallback(
    async (value: UiThemeId) => {
      if (!currentWorkspace) {
        return;
      }

      setCurrentWorkspace((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          uiTheme: value,
        };
      });

      try {
        await updateWorkspace({
          variables: {
            input: {
              uiTheme: value,
            },
          },
        });
      } catch (error) {
        logError(error);
        setCurrentWorkspace((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            uiTheme,
          };
        });
      }
    },
    [currentWorkspace, setCurrentWorkspace, uiTheme, updateWorkspace],
  );

  return {
    uiTheme,
    setUiTheme,
  };
};
