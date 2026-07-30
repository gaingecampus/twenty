import { type I18n } from '@lingui/core';
import { isNonEmptyString } from '@sniptt/guards';
import { type APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
import { isDefined } from 'twenty-shared/utils';

import { translateStandardLabel } from 'src/engine/core-modules/i18n/utils/translate-standard-label.util';
import { type FieldMetadataDTO } from 'src/engine/metadata-modules/field-metadata/dtos/field-metadata.dto';

const shouldTranslateBuiltInFieldLabel = ({
  isSystem,
  fieldName,
  sourceValue,
  labelKey,
}: {
  isSystem: boolean | undefined;
  fieldName: string | undefined;
  sourceValue: string;
  labelKey: 'label' | 'description' | 'icon';
}): boolean => {
  if (labelKey === 'icon') {
    return false;
  }

  // System fields on custom objects still use English source labels (Creation date, …)
  if (isSystem === true) {
    return true;
  }

  // Default Name field on custom objects is not marked isSystem but is built-in
  return fieldName === 'name' && sourceValue === 'Name';
};

export const resolveFieldMetadataStandardOverride = (
  fieldMetadata: Pick<
    FieldMetadataDTO,
    'label' | 'description' | 'icon' | 'standardOverrides' | 'isSystem' | 'name'
  >,
  labelKey: 'label' | 'description' | 'icon',
  locale: keyof typeof APP_LOCALES | undefined,
  i18nInstance: I18n,
  isStandardApp: boolean,
  applicationCatalog?: Record<string, string>,
): string => {
  const safeLocale = locale ?? SOURCE_LOCALE;

  if (!isStandardApp && !isDefined(applicationCatalog)) {
    const sourceValue = fieldMetadata[labelKey] ?? '';

    if (
      shouldTranslateBuiltInFieldLabel({
        isSystem: fieldMetadata.isSystem,
        fieldName: fieldMetadata.name,
        sourceValue,
        labelKey,
      })
    ) {
      return translateStandardLabel({
        sourceValue,
        isStandardApp: true,
        applicationCatalog: undefined,
        i18nInstance,
      });
    }

    return sourceValue;
  }

  if (labelKey === 'icon' && isDefined(fieldMetadata.standardOverrides?.icon)) {
    return fieldMetadata.standardOverrides.icon;
  }

  if (
    isDefined(fieldMetadata.standardOverrides?.translations) &&
    labelKey !== 'icon'
  ) {
    const translationValue =
      fieldMetadata.standardOverrides.translations[safeLocale]?.[labelKey];

    if (isDefined(translationValue)) {
      return translationValue;
    }
  }

  if (isNonEmptyString(fieldMetadata.standardOverrides?.[labelKey])) {
    return fieldMetadata.standardOverrides[labelKey] ?? '';
  }

  return translateStandardLabel({
    sourceValue: fieldMetadata[labelKey] ?? '',
    isStandardApp,
    applicationCatalog,
    i18nInstance,
  });
};
