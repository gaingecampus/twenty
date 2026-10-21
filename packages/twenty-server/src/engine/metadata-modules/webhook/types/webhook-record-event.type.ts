import { type ObjectRecordEvent } from 'twenty-shared/database-events';

export type WebhookRecordEvent = Omit<ObjectRecordEvent, 'properties'> & {
  properties: {
    after?: object;
    before?: object;
    updatedFields?: string[];
  };
};
