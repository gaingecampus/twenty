import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const sidePanelHeaderActionsElementState =
  createAtomState<HTMLElement | null>({
    key: 'sidePanelHeaderActionsElementState',
    defaultValue: null,
  });

export const sidePanelHeaderTitleSuffixElementState =
  createAtomState<HTMLElement | null>({
    key: 'sidePanelHeaderTitleSuffixElementState',
    defaultValue: null,
  });
