import { SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';

export const isSettingsManyToManyRelationType = (
  relationType: string | undefined,
): relationType is typeof SETTINGS_MANY_TO_MANY_RELATION_TYPE =>
  relationType === SETTINGS_MANY_TO_MANY_RELATION_TYPE;
