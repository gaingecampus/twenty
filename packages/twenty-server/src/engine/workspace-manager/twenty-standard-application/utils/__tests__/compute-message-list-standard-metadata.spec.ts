import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { ViewKey, ViewType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

describe('Recipient list index metadata', () => {
  it('provides a standard index table and name column for existing and new lists', () => {
    const { allFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: '2026-01-01T00:00:00.000Z',
        workspaceId: '20202020-1111-4111-8111-111111111111',
        twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
      });
    const list = STANDARD_OBJECTS.messageList;
    const viewId = list.views.allMessageLists.universalIdentifier;
    expect(
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[viewId],
    ).toMatchObject({
      key: ViewKey.INDEX,
      type: ViewType.TABLE,
      objectMetadataUniversalIdentifier: list.universalIdentifier,
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
      list.fields.name.universalIdentifier,
      list.fields.createdBy.universalIdentifier,
      list.fields.createdAt.universalIdentifier,
    ]);
    expect(
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.messageListMember.views.allMessageListMembers
          .universalIdentifier
      ],
    ).toMatchObject({ key: ViewKey.INDEX, type: ViewType.TABLE });
  });
});
