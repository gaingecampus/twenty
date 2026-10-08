import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMessageListsViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'messageList'>, 'context'>,
): Record<string, FlatViewField> => ({
  allMessageListsName: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageList',
    context: {
      viewName: 'allMessageLists',
      viewFieldName: 'name',
      fieldName: 'name',
      position: 0,
      isVisible: true,
      size: 300,
    },
  }),
  allMessageListsCreatedby: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageList',
    context: {
      viewName: 'allMessageLists',
      viewFieldName: 'createdBy',
      fieldName: 'createdBy',
      position: 1,
      isVisible: true,
      size: 180,
    },
  }),
  allMessageListsCreatedat: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'messageList',
    context: {
      viewName: 'allMessageLists',
      viewFieldName: 'createdAt',
      fieldName: 'createdAt',
      position: 2,
      isVisible: true,
      size: 180,
    },
  }),
});
