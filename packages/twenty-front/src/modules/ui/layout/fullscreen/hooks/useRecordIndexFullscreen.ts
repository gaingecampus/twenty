import { useMatch, useSearchParams } from 'react-router-dom';

const FULLSCREEN_QUERY_PARAM = 'tableFullscreen';

export const useRecordIndexFullscreen = () => {
  const isRecordIndex = useMatch('/objects/:objectNamePlural') !== null;
  const [searchParams, setSearchParams] = useSearchParams();
  const isRecordIndexFullscreen =
    isRecordIndex && searchParams.get(FULLSCREEN_QUERY_PARAM) === '1';

  const toggleRecordIndexFullscreen = () => {
    if (!isRecordIndex) return;

    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        if (isRecordIndexFullscreen) {
          nextParams.delete(FULLSCREEN_QUERY_PARAM);
        } else {
          nextParams.set(FULLSCREEN_QUERY_PARAM, '1');
        }
        return nextParams;
      },
      { replace: true },
    );
  };

  return { isRecordIndexFullscreen, toggleRecordIndexFullscreen };
};
