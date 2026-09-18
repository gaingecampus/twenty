import { getStatusBoardPageItems } from '@/status-board/utils/getStatusBoardPageItems';

describe('getStatusBoardPageItems', () => {
  it('should list every page when there are few pages', () => {
    expect(getStatusBoardPageItems({ currentPage: 0, pageCount: 4 })).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it('should keep first, last and neighbours of the current page', () => {
    expect(getStatusBoardPageItems({ currentPage: 9, pageCount: 47 })).toEqual([
      0,
      'gap',
      8,
      9,
      10,
      'gap',
      46,
    ]);
  });

  it('should show a single hidden page instead of a gap', () => {
    expect(getStatusBoardPageItems({ currentPage: 3, pageCount: 47 })).toEqual([
      0,
      1,
      2,
      3,
      4,
      'gap',
      46,
    ]);
  });

  it('should return a single page when there is one page', () => {
    expect(getStatusBoardPageItems({ currentPage: 0, pageCount: 1 })).toEqual([
      0,
    ]);
  });
});
