import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMessageCampaignViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'messageCampaign'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allMessageCampaignsSubject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'subject',
        fieldName: 'subject',
        position: 0,
        isVisible: true,
        size: 300,
      },
    }),
    allMessageCampaignsStatus: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'status',
        fieldName: 'status',
        position: 1,
        isVisible: true,
        size: 180,
      },
    }),
    allMessageCampaignsFromAddress: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'fromAddress',
        fieldName: 'fromAddress',
        position: 2,
        isVisible: true,
        size: 180,
      },
    }),
    allMessageCampaignsList: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'list',
        fieldName: 'list',
        position: 3,
        isVisible: true,
        size: 180,
      },
    }),
    allMessageCampaignsSentAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'sentAt',
        fieldName: 'sentAt',
        position: 4,
        isVisible: true,
        size: 180,
      },
    }),
    allMessageCampaignsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 5,
        isVisible: true,
        size: 180,
      },
    }),
    allMessageCampaignsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'messageCampaign',
      context: {
        viewName: 'allMessageCampaigns',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 6,
        isVisible: true,
        size: 180,
      },
    }),
  };
};
