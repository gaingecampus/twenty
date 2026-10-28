import { useRecordIndexFullscreen } from '@/ui/layout/fullscreen/hooks/useRecordIndexFullscreen';
import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { isMatchingLocation } from '~/utils/isMatchingLocation';

export const useShowFullscreen = () => {
  const location = useLocation();
  const { isRecordIndexFullscreen } = useRecordIndexFullscreen();

  return useMemo(() => {
    if (
      isRecordIndexFullscreen ||
      isMatchingLocation(
        location,
        'settings/' + SettingsPath.RestPlayground + '/*',
      ) ||
      isMatchingLocation(location, 'settings/' + SettingsPath.GraphQLPlayground)
    ) {
      return true;
    }

    return false;
  }, [location, isRecordIndexFullscreen]);
};
