import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { ViewKey, ViewType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

describe('Message campaign index metadata', () => {
  it('provides an index table with visible history columns in the standard application', () => {
    const { allFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: '2026-01-01T00:00:00.000Z',
        workspaceId: '20202020-1111-4111-8111-111111111111',
        twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
      });
    const campaign = STANDARD_OBJECTS.messageCampaign;
    const viewId = campaign.views.allMessageCampaigns.universalIdentifier;

    expect(
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[viewId],
    ).toMatchObject({
      key: ViewKey.INDEX,
      type: ViewType.TABLE,
      objectMetadataUniversalIdentifier: campaign.universalIdentifier,
    });

    const columns = Object.values(
      allFlatEntityMaps.flatViewFieldMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (field) => field.viewUniversalIdentifier === viewId && field.isVisible,
      )
      .sort((first, second) => first.position - second.position);

    expect(
      columns.map((field) => field.fieldMetadataUniversalIdentifier),
    ).toEqual([
      campaign.fields.subject.universalIdentifier,
      campaign.fields.status.universalIdentifier,
      campaign.fields.fromAddress.universalIdentifier,
      campaign.fields.list.universalIdentifier,
      campaign.fields.sentAt.universalIdentifier,
      campaign.fields.createdBy.universalIdentifier,
      campaign.fields.createdAt.universalIdentifier,
    ]);
  });
});
