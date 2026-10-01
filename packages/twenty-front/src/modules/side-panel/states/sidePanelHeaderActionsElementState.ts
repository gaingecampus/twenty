import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const sidePanelHeaderActionsElementState =
  createAtomState<HTMLElement | null>({
    key: 'sidePanelHeaderActionsElementState',
    defaultValue: null,
  });
