import { getStatusBoardRecordMemberIds } from '@/status-board/utils/getStatusBoardRecordMemberIds';

describe('getStatusBoardRecordMemberIds', () => {
  it('shows DRI first, all shared members, and no duplicate or unrelated members', () => {
    expect(
      getStatusBoardRecordMemberIds({
        records: [
          {
            __typename: 'Record',
            id: 'lead',
            assignee: { __typename: 'Record', id: 'dri' },
          },
          { __typename: 'Record', id: 'shared-only' },
        ],
        directFieldNames: ['assignee', 'assigneeId'],
        sharedRelation: { sourceKey: 'leadId', targetKey: 'memberId' },
        sharedLinks: [
          { __typename: 'Record', id: '1', leadId: 'lead', memberId: 'co' },
          { __typename: 'Record', id: '2', leadId: 'lead', memberId: 'dri' },
          {
            __typename: 'Record',
            id: '3',
            leadId: 'shared-only',
            memberId: 'other-group',
          },
          {
            __typename: 'Record',
            id: '4',
            leadId: 'unrelated',
            memberId: 'hidden',
          },
        ],
      }),
    ).toEqual({ lead: ['dri', 'co'], 'shared-only': ['other-group'] });
  });
  it('preserves existing contract profiles and handles unassigned records', () => {
    expect(
      getStatusBoardRecordMemberIds({
        records: [
          { __typename: 'Record', id: 'contract' },
          { __typename: 'Record', id: 'empty' },
        ],
        existing: { contract: ['member'] },
        directFieldNames: [],
        sharedLinks: [],
      }),
    ).toEqual({ contract: ['member'], empty: [] });
  });
});
