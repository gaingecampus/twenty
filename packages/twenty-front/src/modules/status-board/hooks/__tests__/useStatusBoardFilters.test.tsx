import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useStatusBoardFilters } from '@/status-board/hooks/useStatusBoardFilters';
import { useStatusBoardMemberIds } from '@/status-board/hooks/useStatusBoardMemberIds';

const members = [
  { __typename: 'TeamMember', id: 'one', currentGroupId: 'a' },
  { __typename: 'TeamMember', id: 'two', currentGroupId: 'a' },
  { __typename: 'TeamMember', id: 'three', currentGroupId: 'c' },
  { __typename: 'TeamMember', id: 'four', currentGroupId: 'c' },
] as ObjectRecord[];
const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);
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
  beforeEach(() => localStorage.clear());

  it('retains two members from A when adding C and selecting another member', () => {
    const { result } = renderHook(useFilters, { wrapper });
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
    const { result } = renderHook(useFilters, { wrapper });
    act(() => result.current.toggleGroupId('c'));
    act(() => result.current.toggleMemberId('three'));
    act(() => result.current.clearSelectedMemberIds());
    expect(result.current.memberIds).toEqual(['three', 'four']);
    act(() => result.current.clearSelectedGroupIds());
    expect(result.current.memberIds).toBeUndefined();
  });
  it('keeps an empty group scoped to no records', () => {
    const { result } = renderHook(useFilters, { wrapper });
    act(() => result.current.toggleGroupId('empty'));
    expect(result.current.memberIds).toEqual([]);
  });
  it('toggles individual members off without clearing the others', () => {
    const { result } = renderHook(useFilters, { wrapper });
    act(() => result.current.toggleMemberId('one'));
    act(() => result.current.toggleMemberId('three'));
    act(() => result.current.toggleMemberId('one'));
    expect(result.current.memberIds).toEqual(['three']);
  });
});

describe('status board filter persistence', () => {
  beforeEach(() => localStorage.clear());

  it('should restore group, member and period filters from the URL', () => {
    const { result } = renderHook(useFilters, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter
          initialEntries={[
            '/status-board?groups=c&members=three&period=quarter&offset=-1',
          ]}
        >
          {children}
        </MemoryRouter>
      ),
    });
    expect(result.current.selectedGroupIds).toEqual(['c']);
    expect(result.current.memberIds).toEqual(['three']);
    expect(result.current.periodType).toBe('quarter');
    expect(result.current.periodOffset).toBe(-1);
  });

  it('should reset the period offset when the period type changes', () => {
    const { result } = renderHook(useFilters, { wrapper });
    act(() => result.current.setPeriodOffset((current) => current - 2));
    expect(result.current.periodOffset).toBe(-2);
    act(() => result.current.selectPeriodType('year'));
    expect(result.current.periodType).toBe('year');
    expect(result.current.periodOffset).toBe(0);
  });

  it('should restore the last selection when opened without filters in the URL', () => {
    const first = renderHook(useFilters, { wrapper });
    act(() => first.result.current.toggleGroupId('c'));
    act(() => first.result.current.selectPeriodType('year'));
    first.unmount();
    const { result } = renderHook(useFilters, { wrapper });
    expect(result.current.selectedGroupIds).toEqual(['c']);
    expect(result.current.periodType).toBe('year');
  });
});
