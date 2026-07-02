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
  targetNoteId: true,
  targetTaskId: true,
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
  targetNote: {
    id: true,
    title: true,
  },
  targetTask: {
    id: true,
    title: true,
  },
  __typename: true,
} satisfies RecordGqlOperationGqlRecordFields;
