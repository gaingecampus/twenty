import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMessageListMembersViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'messageListMember'>, 'context'>,
): Record<string, FlatViewField> => ({
  allMessageListMembersPerson: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageListMember',
    context: {
      viewName: 'allMessageListMembers',
      viewFieldName: 'person',
      fieldName: 'person',
      position: 0,
      isVisible: true,
      size: 300,
    },
  }),
  allMessageListMembersList: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageListMember',
    context: {
      viewName: 'allMessageListMembers',
      viewFieldName: 'list',
      fieldName: 'list',
      position: 1,
      isVisible: true,
      size: 180,
    },
  }),
  allMessageListMembersCreatedat: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageListMember',
    context: {
      viewName: 'allMessageListMembers',
      viewFieldName: 'createdAt',
      fieldName: 'createdAt',
      position: 2,
      isVisible: true,
      size: 180,
    },
  }),
});
