import { type AgentChatThread } from '~/generated-metadata/graphql';

export const filterChatThreadsBySearchQuery = (
  threads: AgentChatThread[],
  searchQuery: string,
): AgentChatThread[] => {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  if (normalizedSearchQuery.length === 0) {
    return threads;
  }

  return threads.filter((thread) => {
    const title = thread.title?.toLowerCase() ?? '';

    return title.includes(normalizedSearchQuery);
  });
};
