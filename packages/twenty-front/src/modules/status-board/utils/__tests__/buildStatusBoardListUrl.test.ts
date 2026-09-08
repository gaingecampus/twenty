import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildStatusBoardListUrl } from '@/status-board/utils/buildStatusBoardListUrl';
import { filterUrlQueryParamsSchema } from '@/views/schemas/filterUrlQueryParamsSchema';
import qs from 'qs';
import {
  FieldMetadataType,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

const metadata = {
  namePlural: 'onboardings',
  fields: [
    { name: 'id', type: FieldMetadataType.UUID },
    { name: 'name', type: FieldMetadataType.TEXT },
    { name: 'customStage', type: FieldMetadataType.SELECT },
    { name: 'depositStatus', type: FieldMetadataType.SELECT },
    { name: 'onboardingStatus', type: FieldMetadataType.SELECT },
    { name: 'contractEndDate', type: FieldMetadataType.DATE },
    { name: 'expectedPaymentDate', type: FieldMetadataType.DATE },
    { name: 'creator', type: FieldMetadataType.RELATION },
    { name: 'revenueDept', type: FieldMetadataType.RELATION },
    { name: 'leadConsultant', type: FieldMetadataType.RELATION },
    { name: 'executionConsultantId', type: FieldMetadataType.UUID },
  ],
} as EnrichedObjectMetadataItem;
const parse = (filter: RecordGqlOperationFilter) => {
  const url = buildStatusBoardListUrl({
    objectMetadataItem: metadata,
    filter,
    viewId: 'table-view',
  });
  expect(url).toContain('/objects/onboardings?viewId=table-view');
  return filterUrlQueryParamsSchema.parse(qs.parse(url.split('?')[1]))
    .filterGroup!;
};

describe('buildStatusBoardListUrl', () => {
  it('preserves a modal search alongside the status filter', () => {
    expect(
      parse({
        and: [
          { onboardingStatus: { eq: 'ACTIVE' } },
          { name: { ilike: '%라온%' } },
        ],
      }).filters,
    ).toEqual([
      { field: 'onboardingStatus', op: 'IS', value: '["ACTIVE"]' },
      { field: 'name', op: 'CONTAINS', value: '라온' },
    ]);
  });
  it('keeps the overdue date, unpaid status, member and department constraints', () => {
    const group = parse({
      and: [
        { depositStatus: { neq: 'PAID' } },
        { expectedPaymentDate: { lt: '2026-09-08' } },
        { creatorId: { in: ['member-id'] } },
        { revenueDeptId: { in: ['group-id'] } },
      ],
    });
    expect(group.filters).toEqual([
      { field: 'depositStatus', op: 'IS_NOT', value: '["PAID"]' },
      { field: 'expectedPaymentDate', op: 'IS_BEFORE', value: '2026-09-08' },
      {
        field: 'creator',
        op: 'IS',
        value: JSON.stringify({
          isCurrentWorkspaceMemberSelected: false,
          selectedRecordIds: ['member-id'],
        }),
      },
      {
        field: 'revenueDept',
        op: 'IS',
        value: JSON.stringify({
          isCurrentWorkspaceMemberSelected: false,
          selectedRecordIds: ['group-id'],
        }),
      },
    ]);
  });
  it('preserves excluded inquiry stages', () => {
    expect(
      parse({ not: { customStage: { in: ['ON_HOLD', 'MATCHING_SUCCESS'] } } })
        .filters,
    ).toEqual([
      {
        field: 'customStage',
        op: 'IS_NOT',
        value: '["ON_HOLD","MATCHING_SUCCESS"]',
      },
    ]);
  });
  it('preserves either consultant within the active contract constraints through the real URL parser', () => {
    const group = parse({
      and: [
        { onboardingStatus: { eq: 'ACTIVE' } },
        {
          or: [
            { leadConsultantId: { in: ['member-id'] } },
            { executionConsultantId: { in: ['member-id'] } },
          ],
        },
      ],
    });
    expect(group.operator).toBe('AND');
    expect(group.filters).toEqual([
      { field: 'onboardingStatus', op: 'IS', value: '["ACTIVE"]' },
    ]);
    expect(group.groups?.[0].operator).toBe('OR');
    expect(group.groups?.[0].filters?.map(({ field }) => field)).toEqual([
      'leadConsultant',
      'executionConsultantId',
    ]);
  });
  it('includes the entire last date of the month, including December rollover', () => {
    expect(
      parse({
        and: [
          { contractEndDate: { gte: '2026-12-01' } },
          { contractEndDate: { lte: '2026-12-31' } },
        ],
      }).filters,
    ).toEqual([
      { field: 'contractEndDate', op: 'IS_AFTER', value: '2026-12-01' },
      { field: 'contractEndDate', op: 'IS_BEFORE', value: '2027-01-01' },
    ]);
  });
  it('retains a no-match filter when the selected group has no members', () => {
    expect(parse({ id: { is: 'NULL' } }).filters).toEqual([
      { field: 'id', op: 'IS_EMPTY', value: '' },
    ]);
  });
});
