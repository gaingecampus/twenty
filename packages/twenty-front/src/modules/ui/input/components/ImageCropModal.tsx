import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledBody = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[5]};
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};

  h2 {
    font-size: ${themeCssVariables.font.size.xl};
    font-weight: ${themeCssVariables.font.weight.semiBold};
    margin: 0;
  }
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;

  &[role='alert'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledPreview = styled.canvas`
  align-self: center;
  aspect-ratio: 1;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: auto;
  max-width: 100%;
  width: 280px;
`;

const StyledControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};

  label {
    color: ${themeCssVariables.font.color.secondary};
    display: flex;
    flex-direction: column;
    font-size: ${themeCssVariables.font.size.sm};
    gap: ${themeCssVariables.spacing[2]};
  }
`;

const StyledSlider = styled.input`
  accent-color: ${themeCssVariables.color.blue};
  cursor: pointer;
  height: 20px;
  margin: 0;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

export const ImageCropModal = ({
  file,
  modalInstanceId,
  onCancel,
  onConfirm,
}: {
  file: File;
  modalInstanceId: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const picture = new Image();
    let active = true;
    picture.onload = () => {
      if (active) setImage(picture);
    };
    picture.onerror = () => {
      if (active)
        setError('이미지를 불러올 수 없습니다. 다른 파일을 선택해 주세요.');
    };
    picture.src = url;
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !image) return;
    const scale =
      Math.min(512 / image.naturalWidth, 512 / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.clearRect(0, 0, 512, 512);
    context.drawImage(
      image,
      (512 - width) / 2 + x,
      (512 - height) / 2 + y,
      width,
      height,
    );
  }, [image, zoom, x, y]);

  const confirm = () => {
    if (!image || saving) return;
    setSaving(true);
    canvasRef.current?.toBlob((blob) => {
      if (!blob) {
        setError('이미지를 저장하지 못했습니다. 다시 시도해 주세요.');
        setSaving(false);
        return;
      }
      onConfirm(
        new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.png`, {
          type: 'image/png',
        }),
      );
    }, 'image/png');
  };

  return (
    <ModalStatefulWrapper
      modalInstanceId={modalInstanceId}
      isClosable
      onClose={onCancel}
      renderInDocumentBody
      padding="none"
    >
      <StyledBody>
        <StyledHeader>
          <h2>썸네일 조정</h2>
          <StyledDescription>
            정사각형 썸네일 안에서 이미지 크기와 위치를 조절해 주세요.
          </StyledDescription>
        </StyledHeader>
        <StyledPreview
          ref={canvasRef}
          width={512}
          height={512}
          aria-label="썸네일 미리보기"
        />
        <StyledControls>
          <label>
            확대·축소
            <StyledSlider
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <label>
            좌우 위치
            <StyledSlider
              type="range"
              min="-256"
              max="256"
              value={x}
              onChange={(event) => setX(Number(event.target.value))}
            />
          </label>
          <label>
            상하 위치
            <StyledSlider
              type="range"
              min="-256"
              max="256"
              value={y}
              onChange={(event) => setY(Number(event.target.value))}
            />
          </label>
        </StyledControls>
        {file.type === 'image/gif' && (
          <StyledDescription>GIF는 정지 이미지로 등록됩니다.</StyledDescription>
        )}
        {error && <StyledDescription role="alert">{error}</StyledDescription>}
        <StyledActions>
          <Button
            title="초기화"
            variant="secondary"
            onClick={() => {
              setZoom(1);
              setX(0);
              setY(0);
            }}
          />
          <Button title="취소" variant="secondary" onClick={onCancel} />
          <Button
            accent="blue"
            title="등록"
            disabled={!image || saving}
            onClick={confirm}
          />
        </StyledActions>
      </StyledBody>
    </ModalStatefulWrapper>
  );
};
