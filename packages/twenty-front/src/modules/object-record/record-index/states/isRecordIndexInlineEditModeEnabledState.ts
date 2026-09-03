import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isRecordIndexInlineEditModeEnabledState = createAtomState<boolean>(
  {
    key: 'isRecordIndexInlineEditModeEnabledState',
    defaultValue: false,
  },
);
