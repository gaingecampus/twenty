import { useLazyFindManyRecords } from '@/object-record/hooks/useLazyFindManyRecords';
import { useState } from 'react';
import { v4 } from 'uuid';
import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { useFieldManagementMetadata } from './useFieldManagementData';
import { useFieldVisitAttachments } from './useFieldVisitAttachments';

export type FieldUploadItem = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
};
export const useFieldVisitUploadQueue = (
  visitId: string,
  existing: boolean,
) => {
  const [items, setItems] = useState<FieldUploadItem[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [validationError, setValidationError] = useState('');
  const metadata = useFieldManagementMetadata();
  const permissions = useObjectPermissionsForObject(
    metadata.attachment?.id ?? '',
  );
  const canUploadFile = useHasPermissionFlag(PermissionFlagType.UPLOAD_FILE);
  const attachments = useFieldVisitAttachments(existing ? [visitId] : []);
  const { uploadAttachmentFile } = useUploadAttachmentFile();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'attachment',
  });
  const canUpload =
    attachments.available &&
    permissions.canUpdateObjectRecords &&
    !!metadata.attachment?.updatableFields.some(
      (field) => field.name === 'file',
    ) &&
    canUploadFile;
  const canDelete = permissions.canSoftDeleteObjectRecords;
  const add = (files: File[]) => {
    if (!canUpload) return;
    const rejected = files.filter(
      (file) => file.size > 20 * 1024 * 1024 || file.size === 0,
    );
    setValidationError(
      rejected.length
        ? `빈 파일 또는 20MB 초과 파일은 추가할 수 없습니다: ${rejected.map((file) => file.name).join(', ')}`
        : '',
    );
    setItems((current) => [
      ...current,
      ...files
        .filter((file) => !rejected.includes(file))
        .map((file) => ({ id: v4(), file, status: 'pending' as const })),
    ]);
  };
  const { findManyRecordsLazy } = useLazyFindManyRecords({
    objectNameSingular: 'attachment',
    filter: { id: { in: items.map((item) => item.id) } },
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
    limit: Math.max(1, items.length),
  });
  const persist = async () => {
    const completed = items.some((item) => item.status === 'error')
      ? await findManyRecordsLazy()
      : undefined;
    if (completed && (completed.error || !completed.records))
      throw new Error('ATTACHMENTS_LOOKUP_FAILED');
    const completedIds = new Set(
      completed?.records?.map((record) => record.id),
    );

    let failed = false;
    for (const item of items.filter((item) => item.status !== 'success')) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: 'uploading' } : entry,
        ),
      );
      try {
        if (!completedIds.has(item.id))
          await uploadAttachmentFile(
            item.file,
            { id: visitId, targetObjectNameSingular: 'fieldVisit' },
            item.id,
          );
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'success' } : entry,
          ),
        );
      } catch {
        failed = true;
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'error' } : entry,
          ),
        );
      }
    }
    for (const id of removed) {
      try {
        await deleteOneRecord(id);
        setRemoved((current) => current.filter((entry) => entry !== id));
      } catch {
        failed = true;
      }
    }
    if (failed) throw new Error('ATTACHMENTS_INCOMPLETE');
  };
  return {
    items,
    removed,
    validationError,
    attachments,
    canUpload,
    unavailableReason: !attachments.available
      ? '현장 기록의 첨부파일 연결을 사용할 수 없습니다.'
      : !permissions.canUpdateObjectRecords
        ? '첨부파일을 추가할 권한이 없습니다.'
        : '파일 업로드 권한이 없습니다.',
    canDelete,
    add,
    persist,
    dirty:
      items.some((item) => item.status !== 'success') || removed.length > 0,
    removePending: (id: string) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    removeExisting: (id: string) => setRemoved((current) => [...current, id]),
    undoRemove: (id: string) =>
      setRemoved((current) => current.filter((item) => item !== id)),
  };
};
