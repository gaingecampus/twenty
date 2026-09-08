import { CoreObjectNameSingular } from 'twenty-shared/types';

export const STATUS_BOARD_OBJECT_NAME_SINGULAR = {
  opportunity: CoreObjectNameSingular.Opportunity,
  company: CoreObjectNameSingular.Company,
  person: CoreObjectNameSingular.Person,
  onboarding: 'onboarding',
  deposit: 'deposit',
  group: 'group',
  member: 'teamMember',
} as const;
