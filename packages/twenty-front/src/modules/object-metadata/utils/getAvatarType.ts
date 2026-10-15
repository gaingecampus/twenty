import { CoreObjectNameSingular } from 'twenty-shared/types';

export const getAvatarType = (objectNameSingular: string) => {
  if (objectNameSingular === CoreObjectNameSingular.WorkspaceMember) {
    return 'rounded';
  }

  if (
    objectNameSingular === CoreObjectNameSingular.Company ||
    ['opportunity', 'onboarding', 'deposit'].includes(objectNameSingular)
  ) {
    return 'squared';
  }

  if (
    objectNameSingular === CoreObjectNameSingular.Task ||
    objectNameSingular === CoreObjectNameSingular.Note
  ) {
    return 'icon';
  }

  return 'rounded';
};
