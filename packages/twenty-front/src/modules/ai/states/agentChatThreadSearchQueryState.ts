import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const agentChatThreadSearchQueryState = createAtomState<string>({
  key: 'agentChatThreadSearchQueryState',
  defaultValue: '',
});
