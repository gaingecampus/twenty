import { useMemo } from 'react';

import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const RELATED_PERSONS_LIMIT = 200;

type PersonRecordForRelatedPersonIds = {
  __typename: string;
  id: string;
};

type OpportunityRecordForRelatedPersonIds = {
  __typename: string;
  id: string;
  pointOfContactId?: string | null;
  companyId?: string | null;
};

export const useRelatedPersonIdsForAttachments = (
  targetableObject: ActivityTargetableObject,
) => {
  const isCompany =
    targetableObject.targetObjectNameSingular === CoreObjectNameSingular.Company;
  const isOpportunity =
    targetableObject.targetObjectNameSingular ===
    CoreObjectNameSingular.Opportunity;

  const { records: companyPeople, loading: companyPeopleLoading } =
    useFindManyRecords<PersonRecordForRelatedPersonIds>({
      objectNameSingular: CoreObjectNameSingular.Person,
      filter: { companyId: { eq: targetableObject.id } },
      recordGqlFields: { id: true },
      limit: RELATED_PERSONS_LIMIT,
      skip: !isCompany,
    });

  const { record: opportunityRecord, loading: opportunityLoading } =
    useFindOneRecord<OpportunityRecordForRelatedPersonIds>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      objectRecordId: targetableObject.id,
      recordGqlFields: {
        id: true,
        pointOfContactId: true,
        companyId: true,
      },
      skip: !isOpportunity,
    });

  const opportunityCompanyId = opportunityRecord?.companyId;

  const {
    records: opportunityCompanyPeople,
    loading: opportunityCompanyPeopleLoading,
  } = useFindManyRecords<PersonRecordForRelatedPersonIds>({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: { companyId: { eq: opportunityCompanyId ?? '' } },
    recordGqlFields: { id: true },
    limit: RELATED_PERSONS_LIMIT,
    skip: !isOpportunity || !isDefined(opportunityCompanyId),
  });

  const relatedPersonIds = useMemo(() => {
    if (isCompany) {
      return companyPeople.map((person) => person.id);
    }

    if (isOpportunity) {
      return [
        ...new Set(
          [
            opportunityRecord?.pointOfContactId,
            ...opportunityCompanyPeople.map((person) => person.id),
          ].filter(isDefined),
        ),
      ];
    }

    return [];
  }, [
    isCompany,
    isOpportunity,
    companyPeople,
    opportunityRecord?.pointOfContactId,
    opportunityCompanyPeople,
  ]);

  const loading =
    (isCompany && companyPeopleLoading) ||
    (isOpportunity &&
      (opportunityLoading || opportunityCompanyPeopleLoading));

  return { relatedPersonIds, loading };
};
