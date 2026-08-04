import { type IconComponent, IllustrationIconManyToMany } from 'twenty-ui/icon';
import OneToManySvg from '@/settings/data-model/assets/OneToMany.svg';
import { RELATION_TYPES } from '@/settings/data-model/constants/RelationTypes';
import { SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';
import { type SettingsRelationType } from '@/settings/data-model/types/SettingsRelationType';

export const SETTINGS_RELATION_TYPES: Record<
  SettingsRelationType,
  {
    label: string;
    Icon: IconComponent;
    imageSrc: string;
    isImageFlipped?: boolean;
  }
> = {
  ...RELATION_TYPES,
  [SETTINGS_MANY_TO_MANY_RELATION_TYPE]: {
    label: 'Many to many',
    Icon: IllustrationIconManyToMany,
    imageSrc: OneToManySvg,
  },
};
