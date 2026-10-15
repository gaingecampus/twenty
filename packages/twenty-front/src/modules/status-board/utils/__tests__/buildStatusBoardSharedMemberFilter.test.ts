import { buildStatusBoardSharedMemberFilter } from '@/status-board/utils/buildStatusBoardSharedMemberFilter';

describe('buildStatusBoardSharedMemberFilter', () => {
  const directFilter = { assigneeId: { in: ['member'] } };
  it('includes shared-only records alongside directly assigned records without duplicate IDs', () => {
    expect(
      buildStatusBoardSharedMemberFilter({
        memberIds: ['member'],
        directFilter,
        sharedRecordIds: ['shared', 'shared'],
      }),
    ).toEqual({ or: [directFilter, { id: { in: ['shared'] } }] });
  });
  it('does not restrict all-members scope', () => {
    expect(
      buildStatusBoardSharedMemberFilter({
        memberIds: undefined,
        directFilter,
        sharedRecordIds: ['shared'],
      }),
    ).toBeUndefined();
  });
  it('does not expose shared records for an empty member scope', () => {
    expect(
      buildStatusBoardSharedMemberFilter({
        memberIds: [],
        directFilter,
        sharedRecordIds: ['shared'],
      }),
    ).toEqual({ id: { is: 'NULL' } });
  });
  it('supports a shared assignment even without a readable direct field', () => {
    expect(
      buildStatusBoardSharedMemberFilter({
        memberIds: ['member'],
        directFilter: undefined,
        sharedRecordIds: ['shared'],
      }),
    ).toEqual({ or: [{ id: { in: ['shared'] } }] });
  });
});
