import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildStatusBoardIdInFilter } from '@/status-board/utils/buildStatusBoardIdInFilter';
import { FieldMetadataType } from 'twenty-shared/types';

describe('buildStatusBoardIdInFilter', () => {
  const objectMetadataItem = {
    readableFields: [
      {
        name: 'leadConsultant',
        type: FieldMetadataType.RELATION,
        settings: { joinColumnName: 'leadConsultantId' },
      },
      { name: 'executionConsultant', type: FieldMetadataType.RELATION },
    ],
  } as EnrichedObjectMetadataItem;
  it('uses a valid empty-result filter for groups without members', () => {
    expect(
      buildStatusBoardMemberFilter({
        objectMetadataItem,
        fieldNames: ['leadConsultant'],
        memberIds: [],
      }),
    ).toEqual({ id: { is: 'NULL' } });
  });
  it('does not show every record when an ownership field is unavailable', () => {
    expect(
      buildStatusBoardMemberFilter({
        objectMetadataItem,
        fieldNames: ['missingOwner'],
        memberIds: ['member-1'],
      }),
    ).toEqual({ id: { is: 'NULL' } });
  });
  it('filters relation IDs instead of sending UUID operators to relation objects', () => {
    expect(
      buildStatusBoardIdInFilter({
        objectMetadataItem,
        fieldNames: ['leadConsultant', 'leadConsultantId'],
        ids: ['member-1'],
      }),
    ).toEqual({ leadConsultantId: { in: ['member-1'] } });
  });
  it('includes either consultant without duplicate join-column conditions', () => {
    expect(
      buildStatusBoardIdInFilter({
        objectMetadataItem,
        fieldNames: [
          'leadConsultant',
          'leadConsultantId',
          'executionConsultant',
          'executionConsultantId',
        ],
        ids: ['member-1'],
      }),
    ).toEqual({
      or: [
        { leadConsultantId: { in: ['member-1'] } },
        { executionConsultantId: { in: ['member-1'] } },
      ],
    });
  });
});
