import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type MessageListMemberEmailFilter = 'all' | 'withEmail' | 'withoutEmail';

export const getMessageListMemberEmailFilter = (
  listId: string,
  emailFilter: MessageListMemberEmailFilter,
): RecordGqlOperationFilter => {
  const listFilter = { listId: { eq: listId } };

  if (emailFilter === 'all') return listFilter;

  // Relation subfilters are supported by the API but not its shared leaf type.
  const missingEmailFilter = {
    and: [
      {
        or: [
          { person: { emails: { primaryEmail: { is: 'NULL' } } } },
          { person: { emails: { primaryEmail: { eq: '' } } } },
        ],
      },
      {
        or: [
          { workspaceMember: { userEmail: { is: 'NULL' } } },
          { workspaceMember: { userEmail: { eq: '' } } },
        ],
      },
    ],
  } as unknown as RecordGqlOperationFilter;

  return {
    and: [
      listFilter,
      emailFilter === 'withoutEmail'
        ? missingEmailFilter
        : { not: missingEmailFilter },
    ],
  };
};
