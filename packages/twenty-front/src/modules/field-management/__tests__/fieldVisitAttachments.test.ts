import {
  getFieldVisitAttachments,
  groupFieldVisitPhotos,
  formatFieldFileSize,
} from '@/field-management/fieldVisitAttachments';

describe('field visit attachments', () => {
  it('separates photos from documents and excludes deleted files', () => {
    const files = getFieldVisitAttachments([
      {
        id: 'photo',
        __typename: 'Attachment',
        targetFieldVisitId: 'visit',
        file: [
          { label: '현장.JPG', extension: '.JPG', url: '/photo', size: 1024 },
        ],
      },
      {
        id: 'document',
        __typename: 'Attachment',
        targetFieldVisitId: 'visit',
        file: [{ label: 'report.pdf', extension: '.pdf', url: '/report' }],
      },
      {
        id: 'deleted',
        __typename: 'Attachment',
        file: [{ label: 'old.png', url: '/old', isDeleted: true }],
      },
    ]);
    expect(files.map((file) => file.isImage)).toEqual([true, false]);
    expect(files[0].size).toBe(1024);
    expect(formatFieldFileSize(files[0].size)).toBe('1 KB');
  });
  it('groups only photos belonging to visible visits by field date, latest first', () => {
    const files = [
      { id: '1', visitId: 'first', name: 'a', url: '/a', isImage: true },
      { id: '2', visitId: 'second', name: 'b', url: '/b', isImage: true },
      { id: '3', visitId: 'hidden', name: 'c', url: '/c', isImage: true },
      { id: '4', visitId: 'second', name: 'd', url: '/d', isImage: false },
    ];
    const groups = groupFieldVisitPhotos(files, [
      {
        id: 'first',
        __typename: 'FieldVisit',
        visitDate: '2026-09-01',
        sessionNumber: 1,
      },
      {
        id: 'second',
        __typename: 'FieldVisit',
        visitDate: '2026-09-15',
        sessionNumber: 2,
      },
    ]);
    expect(groups.map(([date]) => date)).toEqual(['2026-09-15', '2026-09-01']);
    expect(groups[0][1]).toHaveLength(1);
    expect(groups[0][1][0].visit.sessionNumber).toBe(2);
  });
});
