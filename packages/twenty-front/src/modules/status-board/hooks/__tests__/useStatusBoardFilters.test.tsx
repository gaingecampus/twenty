import { act, renderHook } from '@testing-library/react';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useStatusBoardFilters } from '@/status-board/hooks/useStatusBoardFilters';
import { useStatusBoardMemberIds } from '@/status-board/hooks/useStatusBoardMemberIds';

const members = [
  { __typename: 'TeamMember', id: 'one', currentGroupId: 'a' },
  { __typename: 'TeamMember', id: 'two', currentGroupId: 'a' },
  { __typename: 'TeamMember', id: 'three', currentGroupId: 'c' },
  { __typename: 'TeamMember', id: 'four', currentGroupId: 'c' },
] as ObjectRecord[];
const useFilters = () => {
  const filters = useStatusBoardFilters(members);
  const scope = useStatusBoardMemberIds({
    members,
    selectedGroupIds: filters.selectedGroupIds,
    selectedMemberIds: filters.selectedMemberIds,
  });
  return { ...filters, ...scope };
};

describe('status board multi-member selection', () => {
  it('retains two members from A when adding C and selecting another member', () => {
    const { result } = renderHook(useFilters);
    act(() => result.current.toggleGroupId('a'));
    act(() => result.current.toggleMemberId('one'));
    act(() => result.current.toggleMemberId('two'));
    act(() => result.current.toggleGroupId('c'));
    expect(result.current.memberIds).toEqual(['one', 'two']);
    act(() => result.current.toggleMemberId('three'));
    expect(result.current.memberIds).toEqual(['one', 'two', 'three']);
    act(() => result.current.toggleGroupId('a'));
    expect(result.current.selectedMemberIds).toEqual(['three']);
    expect(result.current.memberIds).toEqual(['three']);
  });
  it('selects all members within the selected groups and resets to all groups', () => {
    const { result } = renderHook(useFilters);
    act(() => result.current.toggleGroupId('c'));
    act(() => result.current.toggleMemberId('three'));
    act(() => result.current.clearSelectedMemberIds());
    expect(result.current.memberIds).toEqual(['three', 'four']);
    act(() => result.current.clearSelectedGroupIds());
    expect(result.current.memberIds).toBeUndefined();
  });
  it('keeps an empty group scoped to no records', () => {
    const { result } = renderHook(useFilters);
    act(() => result.current.toggleGroupId('empty'));
    expect(result.current.memberIds).toEqual([]);
  });
  it('toggles individual members off without clearing the others', () => {
    const { result } = renderHook(useFilters);
    act(() => result.current.toggleMemberId('one'));
    act(() => result.current.toggleMemberId('three'));
    act(() => result.current.toggleMemberId('one'));
    expect(result.current.memberIds).toEqual(['three']);
  });
});
