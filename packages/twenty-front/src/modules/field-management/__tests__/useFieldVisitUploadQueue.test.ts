import { act, renderHook } from '@testing-library/react';
import { useFieldVisitUploadQueue } from '@/field-management/useFieldVisitUploadQueue';

const mockUpload = jest.fn();
const mockFind = jest.fn();
const mockDelete = jest.fn();
let mockPermission = true;
jest.mock('@/activities/files/hooks/useUploadAttachmentFile', () => ({
  useUploadAttachmentFile: () => ({ uploadAttachmentFile: mockUpload }),
}));
jest.mock('@/object-record/hooks/useLazyFindManyRecords', () => ({
  useLazyFindManyRecords: () => ({ findManyRecordsLazy: mockFind }),
}));
jest.mock('@/object-record/hooks/useDeleteOneRecord', () => ({
  useDeleteOneRecord: () => ({ deleteOneRecord: mockDelete }),
}));
jest.mock('@/settings/roles/hooks/useHasPermissionFlag', () => ({
  useHasPermissionFlag: () => mockPermission,
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: () => ({
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: true,
  }),
}));
jest.mock('@/field-management/useFieldManagementData', () => ({
  useFieldManagementMetadata: () => ({
    attachment: { id: 'attachment', updatableFields: [{ name: 'file' }] },
  }),
}));
jest.mock('@/field-management/useFieldVisitAttachments', () => ({
  useFieldVisitAttachments: () => ({ available: true, files: [] }),
}));

describe('field visit upload queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermission = true;
    mockFind.mockResolvedValue({ records: [] });
  });
  it('keeps successful files and retries only failed uploads with the same attachment ID', async () => {
    mockUpload
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({});
    const { result } = renderHook(() =>
      useFieldVisitUploadQueue('visit', false),
    );
    act(() =>
      result.current.add([
        new File(['photo'], 'photo.jpg'),
        new File(['report'], 'report.pdf'),
      ]),
    );
    await act(async () => {
      await expect(result.current.persist()).rejects.toThrow(
        'ATTACHMENTS_INCOMPLETE',
      );
    });
    expect(result.current.items.map((item) => item.status)).toEqual([
      'success',
      'error',
    ]);
    const failedId = result.current.items[1].id;
    await act(async () => {
      await result.current.persist();
    });
    expect(mockUpload).toHaveBeenCalledTimes(3);
    expect(mockUpload.mock.calls[2][2]).toBe(failedId);
    expect(result.current.dirty).toBe(false);
  });
  it('does not duplicate an upload when the previous server response was lost', async () => {
    mockUpload.mockRejectedValueOnce(new Error('response lost'));
    const { result } = renderHook(() =>
      useFieldVisitUploadQueue('visit', false),
    );
    act(() => result.current.add([new File(['photo'], 'photo.jpg')]));
    await act(async () => {
      await expect(result.current.persist()).rejects.toThrow();
    });
    mockFind.mockResolvedValue({
      records: [{ id: result.current.items[0].id }],
    });
    await act(async () => {
      await result.current.persist();
    });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(result.current.items[0].status).toBe('success');
  });
  it('rejects empty files and cannot enqueue without upload permission', () => {
    const { result } = renderHook(() =>
      useFieldVisitUploadQueue('visit', false),
    );
    act(() => result.current.add([new File([], 'empty.txt')]));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.validationError).toContain('empty.txt');
    mockPermission = false;
    const denied = renderHook(() => useFieldVisitUploadQueue('visit', false));
    act(() => denied.result.current.add([new File(['x'], 'file.txt')]));
    expect(denied.result.current.items).toHaveLength(0);
  });
});
