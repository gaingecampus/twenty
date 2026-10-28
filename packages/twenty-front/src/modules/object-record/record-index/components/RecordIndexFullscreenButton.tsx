import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { useRecordIndexFullscreen } from '@/ui/layout/fullscreen/hooks/useRecordIndexFullscreen';
import { IconMaximize, IconMinimize } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const RecordIndexFullscreenButton = () => {
  const { isRecordIndexFullscreen, toggleRecordIndexFullscreen } =
    useRecordIndexFullscreen();
  const label = isRecordIndexFullscreen
    ? '전체 화면 해제'
    : '전체 화면으로 보기';
  const Icon = isRecordIndexFullscreen ? IconMinimize : IconMaximize;

  return (
    <StyledHeaderDropdownButton
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isRecordIndexFullscreen}
      data-toolbar-chip="icon"
      onClick={toggleRecordIndexFullscreen}
    >
      <Icon size={themeCssVariables.icon.size.md} />
    </StyledHeaderDropdownButton>
  );
};
