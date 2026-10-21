import { type ObjectRecordEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { type WebhookRecordEvent } from 'src/engine/metadata-modules/webhook/types/webhook-record-event.type';

// Webhook delivery only uses the latest record and the changed field names.
// Keep the existing wire shape so already running workers can also consume it.
export const compactWebhookEvent = (
  event: ObjectRecordEvent,
): WebhookRecordEvent => {
  const { properties, ...identity } = event;

  return {
    ...identity,
    properties: {
      ...('after' in properties && isDefined(properties.after)
        ? { after: properties.after }
        : 'before' in properties
          ? { before: properties.before }
          : {}),
      ...('updatedFields' in properties
        ? { updatedFields: properties.updatedFields }
        : {}),
    },
  };
};
