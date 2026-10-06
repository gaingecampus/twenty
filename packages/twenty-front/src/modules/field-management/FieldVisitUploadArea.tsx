import { useRef, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { StyledFieldAttachments } from './fieldVisitAttachmentsStyled';
import { formatFieldFileSize } from './fieldVisitAttachments';
import { type useFieldVisitUploadQueue } from './useFieldVisitUploadQueue';

export const FieldVisitUploadArea = ({
  queue,
  disabled,
}: {
  queue: ReturnType<typeof useFieldVisitUploadQueue>;
  disabled: boolean;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <StyledFieldAttachments aria-label="사진·첨부파일 등록">
      <h3>사진·첨부파일</h3>
      {queue.canUpload ? (
        <div
          data-upload-zone
          data-dragging={dragging}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) queue.add(Array.from(event.dataTransfer.files));
          }}
        >
          <p>사진이나 파일을 끌어 놓거나 선택해 주세요.</p>
          <small>
            여러 파일 선택 가능 · 파일당 최대 20MB · 기록 저장 시 업로드
          </small>
          <input
            ref={input}
            type="file"
            multiple
            hidden
            aria-label="사진·첨부파일 선택"
            disabled={disabled}
            onChange={(event) => {
              queue.add(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <Button
            title="파일 선택"
            variant="secondary"
            disabled={disabled}
            onClick={() => input.current?.click()}
          />
        </div>
      ) : (
        <p>{queue.unavailableReason}</p>
      )}
      {queue.validationError && <p role="alert">{queue.validationError}</p>}
      {queue.attachments.loading && <p>기존 첨부파일을 불러오는 중…</p>}
      {queue.attachments.error && (
        <p role="alert">기존 첨부파일을 불러오지 못했습니다.</p>
      )}
      {queue.attachments.files.map((file) => (
        <div data-file-row key={file.id}>
          <div data-file-name>
            {file.name}
            <small>
              {formatFieldFileSize(file.size)}
              {queue.removed.includes(file.id) ? ' · 저장 시 삭제' : ''}
            </small>
          </div>
          {queue.canDelete && (
            <Button
              title={queue.removed.includes(file.id) ? '삭제 취소' : '삭제'}
              size="small"
              variant="secondary"
              disabled={disabled}
              onClick={() =>
                queue.removed.includes(file.id)
                  ? queue.undoRemove(file.id)
                  : queue.removeExisting(file.id)
              }
            />
          )}
        </div>
      ))}
      {queue.items.map((item) => (
        <div key={item.id} data-file-row>
          <div data-file-name>
            {item.file.name}
            <small>
              {formatFieldFileSize(item.file.size)} ·{' '}
              {
                {
                  pending: '업로드 대기',
                  uploading: '업로드 중…',
                  success: '업로드 완료',
                  error: '업로드 실패 · 저장 버튼을 눌러 재시도',
                }[item.status]
              }
            </small>
          </div>
          {item.status !== 'success' && (
            <Button
              title="제외"
              size="small"
              variant="secondary"
              disabled={disabled}
              onClick={() => queue.removePending(item.id)}
            />
          )}
        </div>
      ))}
    </StyledFieldAttachments>
  );
};
