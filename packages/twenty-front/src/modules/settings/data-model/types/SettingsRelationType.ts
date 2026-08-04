import { type RelationType } from '~/generated-metadata/graphql';
import { type SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';

export type SettingsRelationType =
  | RelationType
  | typeof SETTINGS_MANY_TO_MANY_RELATION_TYPE;
