import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type AgentChatThread } from '~/generated-metadata/graphql';

export const isUnusedEmptyChatThread = (
  thread: Pick<
    AgentChatThread,
    'id' | 'title' | 'conversationSize' | 'lastMessageAt'
  >,
  currentThreadId: string | null,
): boolean => {
  if (thread.id === currentThreadId) {
    return false;
  }

  const hasTitle = isNonEmptyString(thread.title);
  const hasMessages =
    thread.conversationSize > 0 || isDefined(thread.lastMessageAt);

  return hasTitle === false && hasMessages === false;
};
