import { FieldLoadingState } from './FieldLoadingState';
import { StyledFieldEmptyState } from './FieldEmptyState';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { downloadFile } from '@/activities/files/utils/downloadFile';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FieldVisitEditorModal } from './FieldVisitEditorModal';
import { StyledFieldAttachments } from './fieldVisitAttachmentsStyled';
import {
  type FieldVisitAttachment,
  formatFieldFileSize,
  groupFieldVisitPhotos,
} from './fieldVisitAttachments';
import { useFieldVisitAttachments } from './useFieldVisitAttachments';
import { text } from './fieldManagementUtils';

export const FieldAttachmentGallery = ({
  files,
  captions,
}: {
  files: FieldVisitAttachment[];
  captions?: Record<string, string>;
}) => {
  const [preview, setPreview] = useState<FieldVisitAttachment>();
  const [error, setError] = useState('');
  const canDownload = useHasPermissionFlag(PermissionFlagType.DOWNLOAD_FILE);
  const photos = files.filter((file) => file.isImage);
  const documents = files.filter((file) => !file.isImage);
  const download = async (file: FieldVisitAttachment) => {
    setError('');
    try {
      await downloadFile(file.url, file.name);
    } catch {
      setError(
        '파일을 다운로드하지 못했습니다. 화면을 새로 불러온 후 다시 시도해 주세요.',
      );
    }
  };
  return (
    <StyledFieldAttachments>
      {photos.length > 0 && (
        <div data-photo-grid>
          {photos.map((file) => (
            <button
              key={file.id}
              type="button"
              data-photo
              onClick={() => setPreview(file)}
              aria-label={`${file.name} 사진 확대`}
            >
              <img src={file.url} alt={file.name} loading="lazy" />
              {captions?.[file.id] && <span>{captions[file.id]}</span>}
            </button>
          ))}
        </div>
      )}
      {documents.map((file) => (
        <div data-file-row key={file.id}>
          <div data-file-name>
            {file.name}
            <small>{formatFieldFileSize(file.size)}</small>
          </div>
          {canDownload && (
            <Button
              title="다운로드"
              size="small"
              variant="secondary"
              onClick={() => void download(file)}
            />
          )}
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
      {preview && (
        <FieldVisitEditorModal
          title="사진 확대"
          onCancel={() => setPreview(undefined)}
        >
          <StyledFieldAttachments>
            <h3>{preview.name}</h3>
            <img data-preview-image src={preview.url} alt={preview.name} />
            {canDownload && (
              <Button
                title="사진 다운로드"
                variant="secondary"
                onClick={() => void download(preview)}
              />
            )}
            {error && <p role="alert">{error}</p>}
          </StyledFieldAttachments>
        </FieldVisitEditorModal>
      )}
    </StyledFieldAttachments>
  );
};

export const FieldVisitAttachments = ({ visitId }: { visitId: string }) => {
  const result = useFieldVisitAttachments([visitId]);
  return (
    <StyledFieldAttachments aria-label="사진·첨부파일">
      <h3>사진·첨부파일 {result.loading ? '…' : result.files.length}</h3>
      {result.loading ? (
        <FieldLoadingState label="사진과 첨부파일을 불러오는 중…" />
      ) : !result.available ? (
        <p>첨부파일을 조회할 수 없습니다. 접근 권한을 확인해 주세요.</p>
      ) : result.error ? (
        <p role="alert">
          첨부파일을 불러오지 못했습니다.{' '}
          <button onClick={() => void result.refetch()}>다시 시도</button>
        </p>
      ) : result.files.length === 0 ? (
        <StyledFieldEmptyState>
          등록된 사진과 첨부파일이 없습니다.
        </StyledFieldEmptyState>
      ) : (
        <FieldAttachmentGallery files={result.files} />
      )}
    </StyledFieldAttachments>
  );
};

export const FieldContractPhotos = ({ visits }: { visits: ObjectRecord[] }) => {
  const result = useFieldVisitAttachments(visits.map((visit) => visit.id));
  const groups = groupFieldVisitPhotos(result.files, visits);
  return (
    <StyledFieldAttachments aria-label="계약 사진 모아보기">
      {result.loading ? (
        <FieldLoadingState label="사진을 불러오는 중…" />
      ) : !result.available ? (
        <p>사진을 조회할 수 없습니다. 접근 권한을 확인해 주세요.</p>
      ) : result.error ? (
        <p role="alert">
          사진을 불러오지 못했습니다.{' '}
          <button onClick={() => void result.refetch()}>다시 시도</button>
        </p>
      ) : groups.length === 0 ? (
        <StyledFieldEmptyState>
          <span>
            등록된 현장 사진이 없습니다.
            <br />
            현장 기록을 작성하거나 수정할 때 사진을 추가해 주세요.
          </span>
        </StyledFieldEmptyState>
      ) : (
        groups.map(([date, entries]) => (
          <section key={date}>
            <h4>
              {date} · {entries.length}장
            </h4>
            <FieldAttachmentGallery
              files={entries.map(({ file }) => file)}
              captions={Object.fromEntries(
                entries.map(({ file, visit }) => [
                  file.id,
                  `${visit.sessionNumber ? `${String(visit.sessionNumber)}회차` : '회차 미입력'} · ${text(visit.name)}`,
                ]),
              )}
            />
          </section>
        ))
      )}
    </StyledFieldAttachments>
  );
};
