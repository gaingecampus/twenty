import { buildActivityTargetsFilterForTargetableObject } from '@/activities/files/utils/build-activity-targets-filter-for-targetable-object.util';

describe('buildActivityTargetsFilterForTargetableObject', () => {
  it('should return direct person filter for person records', () => {
    expect(
      buildActivityTargetsFilterForTargetableObject({
        targetObjectNameSingular: 'person',
        targetableObjectId: 'person-id',
        relatedPersonIds: [],
      }),
    ).toEqual({
      targetPersonId: {
        eq: 'person-id',
      },
    });
  });

  it('should return direct company filter when related person ids are empty', () => {
    expect(
      buildActivityTargetsFilterForTargetableObject({
        targetObjectNameSingular: 'company',
        targetableObjectId: 'company-id',
        relatedPersonIds: [],
      }),
    ).toEqual({
      targetCompanyId: {
        eq: 'company-id',
      },
    });
  });

  it('should return or filter for company with related person ids', () => {
    expect(
      buildActivityTargetsFilterForTargetableObject({
        targetObjectNameSingular: 'company',
        targetableObjectId: 'company-id',
        relatedPersonIds: ['person-1', 'person-2'],
      }),
    ).toEqual({
      or: [
        {
          targetCompanyId: {
            eq: 'company-id',
          },
        },
        {
          targetPersonId: {
            in: ['person-1', 'person-2'],
          },
        },
      ],
    });
  });

  it('should return or filter for opportunity with related person ids', () => {
    expect(
      buildActivityTargetsFilterForTargetableObject({
        targetObjectNameSingular: 'opportunity',
        targetableObjectId: 'opportunity-id',
        relatedPersonIds: ['person-1'],
      }),
    ).toEqual({
      or: [
        {
          targetOpportunityId: {
            eq: 'opportunity-id',
          },
        },
        {
          targetPersonId: {
            in: ['person-1'],
          },
        },
      ],
    });
  });
});
