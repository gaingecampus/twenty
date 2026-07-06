import { type RelationRollupSettings } from 'twenty-shared/types';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';

export const areRelationRollupSettingsEqual = (
  firstRelationRollup: RelationRollupSettings,
  secondRelationRollup: RelationRollupSettings,
): boolean => {
  return isDeeplyEqual(firstRelationRollup, secondRelationRollup);
};
