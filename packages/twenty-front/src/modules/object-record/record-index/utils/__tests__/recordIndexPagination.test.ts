import { clampRecordIndexPage } from '@/object-record/record-index/utils/clampRecordIndexPage';
import { getRecordIndexPageCount } from '@/object-record/record-index/utils/getRecordIndexPageCount';
import { getRecordIndexPageOffset } from '@/object-record/record-index/utils/getRecordIndexPageOffset';
import { getRecordIndexPaginationRange } from '@/object-record/record-index/utils/getRecordIndexPaginationRange';
import { getVisibleRecordIndexPageNumbers } from '@/object-record/record-index/utils/getVisibleRecordIndexPageNumbers';
import { isRecordIndexPageSize } from '@/object-record/record-index/utils/isRecordIndexPageSize';

describe('getRecordIndexPageOffset', () => {
  it('should return 0 for the first page', () => {
    expect(getRecordIndexPageOffset(1, 20)).toBe(0);
  });

  it('should return the offset for a later page', () => {
    expect(getRecordIndexPageOffset(3, 20)).toBe(40);
  });

  it('should not return a negative offset', () => {
    expect(getRecordIndexPageOffset(0, 20)).toBe(0);
  });
});

describe('getRecordIndexPageCount', () => {
  it('should return 0 when there are no records', () => {
    expect(getRecordIndexPageCount(0, 20)).toBe(0);
  });

  it('should round up a partial last page', () => {
    expect(getRecordIndexPageCount(21, 20)).toBe(2);
  });

  it('should return 1 when the count equals the page size', () => {
    expect(getRecordIndexPageCount(20, 20)).toBe(1);
  });
});

describe('clampRecordIndexPage', () => {
  it('should keep a page that is in range', () => {
    expect(clampRecordIndexPage(2, 5)).toBe(2);
  });

  it('should clamp to the last page when the page is too high', () => {
    expect(clampRecordIndexPage(9, 3)).toBe(3);
  });

  it('should clamp to 1 when the page is below 1', () => {
    expect(clampRecordIndexPage(0, 3)).toBe(1);
  });

  it('should return 1 when there are no pages', () => {
    expect(clampRecordIndexPage(4, 0)).toBe(1);
  });
});

describe('getRecordIndexPaginationRange', () => {
  it('should return a zero range when there are no records', () => {
    expect(
      getRecordIndexPaginationRange({
        page: 1,
        pageSize: 20,
        totalCount: 0,
      }),
    ).toEqual({ from: 0, to: 0 });
  });

  it('should return the inclusive range for a full page', () => {
    expect(
      getRecordIndexPaginationRange({
        page: 2,
        pageSize: 20,
        totalCount: 55,
      }),
    ).toEqual({ from: 21, to: 40 });
  });

  it('should end at totalCount on the last partial page', () => {
    expect(
      getRecordIndexPaginationRange({
        page: 3,
        pageSize: 20,
        totalCount: 55,
      }),
    ).toEqual({ from: 41, to: 55 });
  });
});

describe('getVisibleRecordIndexPageNumbers', () => {
  it('should return all pages when there are 7 or fewer', () => {
    expect(getVisibleRecordIndexPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should insert ellipsis around the current page for a long list', () => {
    expect(getVisibleRecordIndexPageNumbers(10, 20)).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ]);
  });

  it('should not insert a leading ellipsis near the start', () => {
    expect(getVisibleRecordIndexPageNumbers(2, 20)).toEqual([
      1,
      2,
      3,
      'ellipsis',
      20,
    ]);
  });
});

describe('isRecordIndexPageSize', () => {
  it('should accept the allowed page sizes', () => {
    expect(isRecordIndexPageSize(20)).toBe(true);
  });

  it('should reject a value that is not an allowed page size', () => {
    expect(isRecordIndexPageSize(15)).toBe(false);
    expect(isRecordIndexPageSize('20')).toBe(false);
  });
});
