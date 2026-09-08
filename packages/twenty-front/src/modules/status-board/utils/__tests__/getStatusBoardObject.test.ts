import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getStatusBoardObject } from '@/status-board/utils/getStatusBoardObject';

const makeObject = (nameSingular: string, isActive = true) =>
  ({ id: nameSingular, nameSingular, isActive }) as EnrichedObjectMetadataItem;

const resolveMember = (objectMetadataItems: EnrichedObjectMetadataItem[]) =>
  getStatusBoardObject({
    objectMetadataItems,
    objectPermissionsByObjectMetadataId: {},
    nameSingular: 'teamMember',
    fallbackNames: ['member'],
  });

describe('status board member object resolution', () => {
  it('uses the production teamMember object', () => {
    expect(resolveMember([makeObject('teamMember')])?.nameSingular).toBe(
      'teamMember',
    );
  });

  it('supports the local member object', () => {
    expect(resolveMember([makeObject('member')])?.nameSingular).toBe('member');
  });

  it('prefers teamMember when a legacy member object also exists', () => {
    expect(
      resolveMember([makeObject('member'), makeObject('teamMember')])
        ?.nameSingular,
    ).toBe('teamMember');
  });

  it('ignores inactive objects and reports absent objects', () => {
    expect(
      resolveMember([makeObject('teamMember', false), makeObject('member')])
        ?.nameSingular,
    ).toBe('member');
    expect(resolveMember([])).toBeUndefined();
  });

  it('does not bypass denied access by using the legacy object', () => {
    const result = getStatusBoardObject({
      objectMetadataItems: [makeObject('member'), makeObject('teamMember')],
      objectPermissionsByObjectMetadataId: {
        teamMember: {
          objectMetadataId: 'teamMember',
          canReadObjectRecords: false,
          canUpdateObjectRecords: false,
          canSoftDeleteObjectRecords: false,
          canDestroyObjectRecords: false,
          restrictedFields: {},
          rowLevelPermissionPredicates: [],
          rowLevelPermissionPredicateGroups: [],
        },
      },
      nameSingular: 'teamMember',
      fallbackNames: ['member'],
    });
    expect(result).toBeUndefined();
  });
});
