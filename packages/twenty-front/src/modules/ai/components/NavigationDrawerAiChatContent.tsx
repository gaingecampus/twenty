import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { AiChatThreadDeleteConfirmationModal } from '@/ai/components/AiChatThreadDeleteConfirmationModal';
import { AiChatSkeletonLoader } from '@/ai/components/internal/AiChatSkeletonLoader';
import { NavigationDrawerAiChatThreadSection } from '@/ai/components/NavigationDrawerAiChatThreadSection';
import { AGENT_CHAT_THREAD_GROUP_BY } from '@/ai/constants/AgentChatThreadGroupBy';
import { AI_CHAT_THREAD_ACTIONS_SURFACE } from '@/ai/constants/AiChatThreadActionsSurface';
import { useAiChatThreadClick } from '@/ai/hooks/useAiChatThreadClick';
import { useChatThreads } from '@/ai/hooks/useChatThreads';
import { agentChatThreadGroupByState } from '@/ai/states/agentChatThreadGroupByState';
import { agentChatThreadSearchQueryState } from '@/ai/states/agentChatThreadSearchQueryState';
import { currentAiChatThreadState } from '@/ai/states/currentAiChatThreadState';
import { filterChatThreadsBySearchQuery } from '@/ai/utils/filterChatThreadsBySearchQuery';
import { groupThreadsByDate } from '@/ai/utils/groupThreadsByDate';
import { isUnusedEmptyChatThread } from '@/ai/utils/isUnusedEmptyChatThread';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const StyledThreadList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
`;

const StyledSectionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  justify-content: center;
`;

const StyledFetchMoreTrigger = styled.div`
  height: 1px;
  min-height: 1px;
  width: 100%;
`;

const AI_CHAT_RECENTS_NAVIGATION_SECTION_ID = 'AiChatRecents';

export const NavigationDrawerAiChatContent = () => {
  const { t } = useLingui();

  const currentAiChatThread = useAtomStateValue(currentAiChatThreadState);
  const { handleThreadClick } = useAiChatThreadClick({
    resetNavigationStack: true,
  });
  const agentChatThreadGroupBy = useAtomStateValue(agentChatThreadGroupByState);
  const searchQuery = useAtomStateValue(agentChatThreadSearchQueryState);
  const { locale } = useAtomStateValue(dateLocaleState);

  const { threads, hasNextPage, loading, fetchMoreRef } = useChatThreads();
  const listedThreads = threads.filter(
    (thread) => !isUnusedEmptyChatThread(thread, currentAiChatThread),
  );
  const visibleThreads = filterChatThreadsBySearchQuery(
    listedThreads,
    searchQuery,
  );

  if (loading && threads.length === 0) {
    return (
      <StyledContainer>
        <AiChatSkeletonLoader />
      </StyledContainer>
    );
  }

  const isGroupedByDate =
    agentChatThreadGroupBy === AGENT_CHAT_THREAD_GROUP_BY.DATE;
  const dateGroups = isGroupedByDate
    ? groupThreadsByDate(visibleThreads, new Date(), locale)
    : [];
  const shouldRenderDateGroups = isGroupedByDate && dateGroups.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <StyledContainer>
      <StyledThreadList>
        {shouldRenderDateGroups ? (
          <StyledSectionsContainer>
            {dateGroups.map((dateGroup) => (
              <NavigationDrawerAiChatThreadSection
                key={dateGroup.id}
                sectionId={`AiChatDateGroup:${dateGroup.id}`}
                title={dateGroup.title}
                threads={dateGroup.threads}
                currentThreadId={currentAiChatThread}
                onThreadClick={handleThreadClick}
                showTimestamp={true}
              />
            ))}
          </StyledSectionsContainer>
        ) : visibleThreads.length > 0 ? (
          <NavigationDrawerAiChatThreadSection
            sectionId={AI_CHAT_RECENTS_NAVIGATION_SECTION_ID}
            title={t`Recents`}
            threads={visibleThreads}
            currentThreadId={currentAiChatThread}
            onThreadClick={handleThreadClick}
            showTimestamp={true}
          />
        ) : null}
        {visibleThreads.length === 0 ? (
          <StyledEmptyState>
            {hasSearchQuery ? t`No matching chats` : t`No chat`}
          </StyledEmptyState>
        ) : null}
        {hasNextPage ? <StyledFetchMoreTrigger ref={fetchMoreRef} /> : null}
      </StyledThreadList>
      <AiChatThreadDeleteConfirmationModal
        surface={AI_CHAT_THREAD_ACTIONS_SURFACE.NAV_DRAWER}
      />
    </StyledContainer>
  );
};
