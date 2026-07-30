import { type I18n } from '@lingui/core';

import { CommandMenuItemAvailabilityType } from 'src/engine/metadata-modules/command-menu-item/enums/command-menu-item-availability-type.enum';
import { EngineComponentKey } from 'src/engine/metadata-modules/command-menu-item/enums/engine-component-key.enum';
import { interpolateNavigationCommandMenuItemField } from 'src/engine/metadata-modules/command-menu-item/utils/interpolate-navigation-command-menu-item-field.util';
import {
  NAVIGATION_INTERPOLATED_ICON,
  NAVIGATION_INTERPOLATED_LABEL,
  NAVIGATION_INTERPOLATED_SHORT_LABEL,
} from 'src/engine/metadata-modules/flat-command-menu-item/utils/build-navigation-flat-command-menu-item.util';
import { type ObjectMetadataDTO } from 'src/engine/metadata-modules/object-metadata/dtos/object-metadata.dto';

const STANDARD_APPLICATION_ID = 'standard-app-id';

const mockI18nInstance = {
  _: (messageId: string) => messageId,
} as unknown as I18n;

const mockObjectMetadata = {
  id: 'obj-id-1',
  labelPlural: 'People',
  labelSingular: 'Person',
  description: 'A person',
  icon: 'IconUser',
  standardOverrides: undefined,
} as unknown as ObjectMetadataDTO;

const baseCommandMenuItem = {
  id: 'cmd-id-1',
  engineComponentKey: EngineComponentKey.NAVIGATION,
  label: NAVIGATION_INTERPOLATED_LABEL,
  shortLabel: NAVIGATION_INTERPOLATED_SHORT_LABEL,
  icon: NAVIGATION_INTERPOLATED_ICON,
  position: 1,
  isPinned: false,
  availabilityType: CommandMenuItemAvailabilityType.GLOBAL,
  payload: { objectMetadataItemId: 'obj-id-1' },
  workspaceId: 'ws-id-1',
  applicationId: STANDARD_APPLICATION_ID,
  isActive: true,
  isSystemSideEffect: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultArgs = {
  locale: undefined as undefined,
  isStandardApp: true,
  twentyStandardApplicationId: STANDARD_APPLICATION_ID,
  i18nInstance: mockI18nInstance,
};

describe('interpolateNavigationCommandMenuItemField', () => {
  it('should resolve label template for NAVIGATION items', () => {
    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'label',
      objectMetadata: mockObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('Go to People');
  });

  it('should resolve shortLabel template for NAVIGATION items', () => {
    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'shortLabel',
      objectMetadata: mockObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('People');
  });

  it('should resolve icon template for NAVIGATION items', () => {
    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'icon',
      objectMetadata: mockObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('IconUser');
  });

  it('should return raw label for non-NAVIGATION items', () => {
    const nonNavigationItem = {
      ...baseCommandMenuItem,
      engineComponentKey: EngineComponentKey.CREATE_NEW_RECORD,
      payload: undefined,
      label: 'Create New Record',
    };

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: nonNavigationItem,
      fieldName: 'label',
      objectMetadata: null,
      ...defaultArgs,
    });

    expect(result).toBe('Create New Record');
  });

  it('should return undefined when object metadata is null for a NAVIGATION item', () => {
    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'label',
      objectMetadata: null,
      ...defaultArgs,
    });

    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined shortLabel', () => {
    const itemWithoutShortLabel = {
      ...baseCommandMenuItem,
      shortLabel: undefined,
    };

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: itemWithoutShortLabel,
      fieldName: 'shortLabel',
      objectMetadata: mockObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBeUndefined();
  });

  it('should resolve label for custom object metadata', () => {
    const customObjectMetadata = {
      ...mockObjectMetadata,
      labelPlural: 'Custom Objects',
      icon: 'IconCustom',
    } as unknown as ObjectMetadataDTO;

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'label',
      objectMetadata: customObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('Go to Custom Objects');
  });

  it('should resolve icon for custom object metadata', () => {
    const customObjectMetadata = {
      ...mockObjectMetadata,
      icon: 'IconCustom',
    } as unknown as ObjectMetadataDTO;

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: baseCommandMenuItem,
      fieldName: 'icon',
      objectMetadata: customObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('IconCustom');
  });

  it('should return raw value when payload has no objectMetadataItemId', () => {
    const itemWithPathPayload = {
      ...baseCommandMenuItem,
      payload: { path: '/settings/profile' },
    };

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: itemWithPathPayload,
      fieldName: 'label',
      objectMetadata: null,
      ...defaultArgs,
    });

    expect(result).toBe(NAVIGATION_INTERPOLATED_LABEL);
  });

  it('should return literal label as-is when it has no template variables', () => {
    const itemWithLiteralLabel = {
      ...baseCommandMenuItem,
      label: 'Go to People',
    };

    const result = interpolateNavigationCommandMenuItemField({
      commandMenuItem: itemWithLiteralLabel,
      fieldName: 'label',
      objectMetadata: mockObjectMetadata,
      ...defaultArgs,
    });

    expect(result).toBe('Go to People');
  });
});
