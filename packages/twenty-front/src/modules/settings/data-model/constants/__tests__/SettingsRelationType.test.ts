import { SETTINGS_MANY_TO_MANY_RELATION_TYPE } from '@/settings/data-model/constants/SettingsRelationType';
import { isSettingsManyToManyRelationType } from '@/settings/data-model/utils/isSettingsManyToManyRelationType';
import { RelationType } from '~/generated-metadata/graphql';

describe('isSettingsManyToManyRelationType', () => {
  it('should identify the UI-only many-to-many relation type', () => {
    expect(
      isSettingsManyToManyRelationType(SETTINGS_MANY_TO_MANY_RELATION_TYPE),
    ).toBe(true);
    expect(isSettingsManyToManyRelationType(RelationType.ONE_TO_MANY)).toBe(
      false,
    );
    expect(isSettingsManyToManyRelationType(undefined)).toBe(false);
  });
});
