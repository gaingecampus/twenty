import { sortFieldVisits } from '@/field-management/sortFieldVisits';
const visits = [
  {
    __typename: 'FieldVisit',
    id: 'a',
    name: '기록 10',
    sessionNumber: 10,
    visitDate: '2026-09-28',
    createdAt: '2026-09-29T01:00:00Z',
  },
  {
    __typename: 'FieldVisit',
    id: 'b',
    name: '기록 2',
    sessionNumber: 2,
    visitDate: '2026-09-27',
    createdAt: '2026-09-29T02:00:00Z',
  },
  {
    __typename: 'FieldVisit',
    id: 'c',
    name: '',
    sessionNumber: null,
    visitDate: null,
    createdAt: '2026-09-29T03:00:00Z',
  },
];
it('sorts numeric sessions and titles without mutating the input', () => {
  expect(
    sortFieldVisits(visits, 'sessionNumber', 'asc').map((v) => v.id),
  ).toEqual(['b', 'a', 'c']);
  expect(sortFieldVisits(visits, 'name', 'desc').map((v) => v.id)).toEqual([
    'a',
    'b',
    'c',
  ]);
  expect(visits.map((v) => v.id)).toEqual(['a', 'b', 'c']);
});
it('distinguishes creation time from visit date and keeps missing values last', () => {
  expect(sortFieldVisits(visits, 'createdAt', 'desc').map((v) => v.id)).toEqual(
    ['c', 'b', 'a'],
  );
  expect(sortFieldVisits(visits, 'visitDate', 'asc').map((v) => v.id)).toEqual([
    'b',
    'a',
    'c',
  ]);
  expect(sortFieldVisits(visits, 'visitDate', 'desc').map((v) => v.id)).toEqual(
    ['a', 'b', 'c'],
  );
});
