import { i18n, type MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/core/macro';
import { isString } from '@sniptt/guards';
import { type Nullable } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const GO_TO_PREFIX = 'Go to ';
const GO_TO_SETTINGS_SUFFIX = ' Settings';

// Prefill/custom-app labels that are not resolved via standard-app i18n on the server
const KNOWN_SEEDED_COMMAND_MENU_LABELS: Record<string, MessageDescriptor> = {
  'Quick Lead': msg`Quick Lead`,
};

export const getCommandMenuItemLabel = (
  label: Nullable<string | MessageDescriptor>,
): string => {
  if (!isDefined(label)) {
    return '';
  }

  if (!isString(label)) {
    return i18n._(label);
  }

  const seededLabelDescriptor = KNOWN_SEEDED_COMMAND_MENU_LABELS[label];

  if (isDefined(seededLabelDescriptor)) {
    return i18n._(seededLabelDescriptor);
  }

  // Object navigation labels arrive already interpolated ("Go to 구성원")
  if (
    label.startsWith(GO_TO_PREFIX) &&
    !label.endsWith(GO_TO_SETTINGS_SUFFIX)
  ) {
    const objectLabel = label.slice(GO_TO_PREFIX.length);

    return t`Go to ${objectLabel}`;
  }

  return label;
};
