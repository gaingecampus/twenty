import { type RecordGqlOperationGqlRecordFields } from 'twenty-shared/types';

export const ATTACHMENT_GQL_FIELDS = {
  id: true,
  name: true,
  createdAt: true,
  fullPath: true,
  fileCategory: true,
  attachmentKind: true,
  externalUrl: true,
  targetMessageId: true,
  createdBy: true,
  file: {
    fileId: true,
    label: true,
    extension: true,
    url: true,
    fileCategory: true,
  },
  targetMessage: {
    id: true,
    subject: true,
    messageThreadId: true,
    messageThread: {
      id: true,
    },
  },
  __typename: true,
} satisfies RecordGqlOperationGqlRecordFields;
