import {
  getMessageListMemberEmailFilter,
  type MessageListMemberEmailFilter,
} from '@/activities/emails/utils/getMessageListMemberEmailFilter';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const getMessageListMemberFilter = (
  listId: string,
  emailFilter: MessageListMemberEmailFilter,
  search: string,
): RecordGqlOperationFilter => {
  const filter = getMessageListMemberEmailFilter(listId, emailFilter);
  const query = search.trim();

  if (query.length === 0) return filter;

  const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
  // Relation subfilters are supported by the API but not its shared leaf type.
  const searchFilter = {
    or: [
      { person: { name: { firstName: { ilike: pattern } } } },
      { person: { name: { lastName: { ilike: pattern } } } },
      { person: { emails: { primaryEmail: { ilike: pattern } } } },
      { workspaceMember: { name: { firstName: { ilike: pattern } } } },
      { workspaceMember: { name: { lastName: { ilike: pattern } } } },
      { workspaceMember: { userEmail: { ilike: pattern } } },
    ],
  } as unknown as RecordGqlOperationFilter;

  return { and: [filter, searchFilter] };
};
