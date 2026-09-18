import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
import { type StatusBoardPeriodType } from '@/status-board/utils/getStatusBoardPeriodRange';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PERIOD_TYPES: StatusBoardPeriodType[] = ['month', 'quarter', 'year'];

const FILTER_KEYS = ['groups', 'members', 'period', 'offset'];
const STORAGE_KEY = 'statusBoardFilters';

const saveFilters = (params: URLSearchParams) => {
  try {
    const saved = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = params.get(key);
      if (value !== null) saved.set(key, value);
    }
    localStorage.setItem(STORAGE_KEY, saved.toString());
  } catch {
    // Storage can be unavailable (private mode); the URL still holds filters.
  }
};

const loadFilters = () => {
  try {
    return new URLSearchParams(localStorage.getItem(STORAGE_KEY) ?? '');
  } catch {
    return new URLSearchParams();
  }
};

const readIds = (searchParams: URLSearchParams, key: string) =>
  searchParams.get(key)?.split(',').filter(Boolean) ?? [];

// Filters live in the URL so they survive a refresh and browser back/forward.
export const useStatusBoardFilters = (members: ObjectRecord[]) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupsParam = searchParams.get('groups');
  const membersParam = searchParams.get('members');
  const selectedGroupIds = useMemo(
    () => groupsParam?.split(',').filter(Boolean) ?? [],
    [groupsParam],
  );
  const selectedMemberIds = useMemo(
    () => membersParam?.split(',').filter(Boolean) ?? [],
    [membersParam],
  );
  const hasFilterParams = FILTER_KEYS.some((key) => searchParams.has(key));

  // Opening the board from navigation drops the query string, so restore the
  // last selection once when the URL carries no filters of its own.
  useEffect(() => {
    if (hasFilterParams) return;
    const saved = loadFilters();
    if (saved.toString() === '') return;
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        saved.forEach((value, key) => params.set(key, value));
        return params;
      },
      { replace: true },
    );
    // Runs once on mount; later clears must not re-apply the saved filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodParam = searchParams.get('period');
  const periodType =
    PERIOD_TYPES.find((type) => type === periodParam) ?? 'month';
  const offsetParam = Number(searchParams.get('offset'));
  const periodOffset = Number.isInteger(offsetParam) ? offsetParam : 0;

  const update = useCallback(
    (
      apply: (current: {
        groups: string[];
        members: string[];
        period: StatusBoardPeriodType;
        offset: number;
      }) => Partial<{
        groups: string[];
        members: string[];
        period: StatusBoardPeriodType;
        offset: number;
      }>,
    ) => {
      setSearchParams(
        (previous) => {
          const previousOffset = Number(previous.get('offset'));
          const current = {
            groups: readIds(previous, 'groups'),
            members: readIds(previous, 'members'),
            period:
              PERIOD_TYPES.find((type) => type === previous.get('period')) ??
              'month',
            offset: Number.isInteger(previousOffset) ? previousOffset : 0,
          };
          const next = { ...current, ...apply(current) };
          const params = new URLSearchParams(previous);
          const setOrDelete = (key: string, value: string, empty: string) =>
            value === empty ? params.delete(key) : params.set(key, value);
          setOrDelete('groups', next.groups.join(','), '');
          setOrDelete('members', next.members.join(','), '');
          setOrDelete('period', next.period, 'month');
          setOrDelete('offset', String(next.offset), '0');
          saveFilters(params);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleGroupId = useCallback(
    (groupId: string) =>
      update((current) => {
        const nextGroupIds = current.groups.includes(groupId)
          ? current.groups.filter((id) => id !== groupId)
          : [...current.groups, groupId];
        const availableIds = new Set(
          members
            .filter(
              (member) =>
                nextGroupIds.length === 0 ||
                nextGroupIds.includes(
                  getStatusBoardMemberGroupId(member) ?? '',
                ),
            )
            .map((member) => member.id),
        );
        return {
          groups: nextGroupIds,
          members: current.members.filter((id) => availableIds.has(id)),
        };
      }),
    [members, update],
  );

  const toggleMemberId = useCallback(
    (memberId: string) =>
      update((current) => ({
        members: current.members.includes(memberId)
          ? current.members.filter((id) => id !== memberId)
          : [...current.members, memberId],
      })),
    [update],
  );

  const clearSelectedGroupIds = useCallback(
    () => update(() => ({ groups: [], members: [] })),
    [update],
  );

  const clearSelectedMemberIds = useCallback(
    () => update(() => ({ members: [] })),
    [update],
  );

  const selectPeriodType = useCallback(
    (nextPeriodType: StatusBoardPeriodType) =>
      update(() => ({ period: nextPeriodType, offset: 0 })),
    [update],
  );

  const setPeriodOffset = useCallback(
    (next: number | ((current: number) => number)) =>
      update((current) => ({
        offset: typeof next === 'function' ? next(current.offset) : next,
      })),
    [update],
  );

  return {
    selectedGroupIds,
    selectedMemberIds,
    periodType,
    periodOffset,
    toggleGroupId,
    toggleMemberId,
    clearSelectedGroupIds,
    clearSelectedMemberIds,
    selectPeriodType,
    setPeriodOffset,
  };
};
