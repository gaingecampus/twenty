import { type I18n } from '@lingui/core';
import { isDefined } from 'twenty-shared/utils';

import { translateStandardLabel } from 'src/engine/core-modules/i18n/utils/translate-standard-label.util';

export const resolveNavigationMenuItemName = ({
  name,
  applicationId,
  twentyStandardApplicationId,
  i18nInstance,
  applicationCatalog,
}: {
  name: string;
  applicationId: string | undefined;
  twentyStandardApplicationId: string;
  i18nInstance: I18n;
  applicationCatalog?: Record<string, string>;
}): string => {
  if (!isDefined(applicationId)) {
    return name;
  }

  const isStandardApp = applicationId === twentyStandardApplicationId;

  return translateStandardLabel({
    sourceValue: name,
    isStandardApp,
    applicationCatalog,
    i18nInstance,
  });
};
