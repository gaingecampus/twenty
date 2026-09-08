import {
  EMPTY_STATUS_BOARD_DUMMY_DATASET,
  StatusBoardDummyDataContext,
} from '@/status-board/contexts/StatusBoardDummyDataContext';
import { useStatusBoardGroups } from '@/status-board/hooks/useStatusBoardGroups';
import {
  buildStatusBoardDummyDataset,
  buildStatusBoardDummyFallbackMembers,
  STATUS_BOARD_DUMMY_FALLBACK_GROUPS,
} from '@/status-board/utils/buildStatusBoardDummyDataset';
import { isStatusBoardDummyDataEnabled } from '@/status-board/utils/isStatusBoardDummyDataEnabled';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useMemo, type ReactNode } from 'react';

export const StatusBoardDummyDataProvider = ({
  members,
  skipGroups,
  children,
}: {
  members: ObjectRecord[];
  skipGroups: boolean;
  children: ReactNode;
}) => {
  const enabled = isStatusBoardDummyDataEnabled();
  const { groups, loading: groupsLoading } = useStatusBoardGroups({
    skip: skipGroups,
  });

  const value = useMemo(() => {
    if (enabled !== true) {
      return {
        enabled: false,
        members,
        groups,
        dataset: EMPTY_STATUS_BOARD_DUMMY_DATASET,
      };
    }

    const isWaitingForGroups =
      skipGroups !== true && groupsLoading && groups.length === 0;

    if (isWaitingForGroups) {
      return {
        enabled: true,
        members,
        groups: [],
        dataset: EMPTY_STATUS_BOARD_DUMMY_DATASET,
      };
    }

    const resolvedGroups =
      groups.length > 0 ? groups : STATUS_BOARD_DUMMY_FALLBACK_GROUPS;
    const resolvedMembers =
      members.length > 0
        ? members
        : buildStatusBoardDummyFallbackMembers(resolvedGroups);

    return {
      enabled: true,
      members: resolvedMembers,
      groups: resolvedGroups,
      dataset: buildStatusBoardDummyDataset({
        members: resolvedMembers,
        groups: resolvedGroups,
      }),
    };
  }, [enabled, groups, groupsLoading, members, skipGroups]);

  return (
    <StatusBoardDummyDataContext.Provider value={value}>
      {children}
    </StatusBoardDummyDataContext.Provider>
  );
};
