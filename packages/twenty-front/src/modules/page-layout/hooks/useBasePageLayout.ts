import { moveMessageListCampaignsToTab } from '@/activities/emails/utils/moveMessageListCampaignsToTab';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { DEFAULT_COMPANY_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultCompanyRecordPageLayout';
import { DEFAULT_COMPANY_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultCompanyRecordPageLayoutId';
import { DEFAULT_MESSAGE_THREAD_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultMessageThreadRecordPageLayout';
import { DEFAULT_MESSAGE_THREAD_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultMessageThreadRecordPageLayoutId';
import { DEFAULT_NOTE_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultNoteRecordPageLayout';
import { DEFAULT_NOTE_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultNoteRecordPageLayoutId';
import { DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultOpportunityRecordPageLayout';
import { DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultOpportunityRecordPageLayoutId';
import { DEFAULT_PERSON_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultPersonRecordPageLayout';
import { DEFAULT_PERSON_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultPersonRecordPageLayoutId';
import { DEFAULT_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultRecordPageLayout';
import { DEFAULT_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultRecordPageLayoutId';
import { DEFAULT_TASK_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultTaskRecordPageLayout';
import { DEFAULT_TASK_RECORD_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultTaskRecordPageLayoutId';
import { DEFAULT_WORKFLOW_PAGE_LAYOUT } from '@/page-layout/constants/DefaultWorkflowPageLayout';
import { DEFAULT_WORKFLOW_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowPageLayoutId';
import { DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT } from '@/page-layout/constants/DefaultWorkflowRunPageLayout';
import { DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowRunPageLayoutId';
import { DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT } from '@/page-layout/constants/DefaultWorkflowVersionPageLayout';
import { DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowVersionPageLayoutId';
import { recordPageLayoutFromIdFamilySelector } from '@/page-layout/states/selectors/recordPageLayoutFromIdFamilySelector';
import { type PageLayout } from '@/page-layout/types/PageLayout';
import { isDefaultPageLayoutId } from '@/page-layout/utils/isDefaultPageLayoutId';
import { transformPageLayout } from '@/page-layout/utils/transformPageLayout';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useQuery } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';
import { FindOnePageLayoutDocument } from '~/generated-metadata/graphql';

const getDefaultLayoutById = (layoutId: string): PageLayout => {
  switch (layoutId) {
    case DEFAULT_COMPANY_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_COMPANY_RECORD_PAGE_LAYOUT;
    case DEFAULT_PERSON_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_PERSON_RECORD_PAGE_LAYOUT;
    case DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_OPPORTUNITY_RECORD_PAGE_LAYOUT;
    case DEFAULT_NOTE_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_NOTE_RECORD_PAGE_LAYOUT;
    case DEFAULT_TASK_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_TASK_RECORD_PAGE_LAYOUT;
    case DEFAULT_WORKFLOW_PAGE_LAYOUT_ID:
      return DEFAULT_WORKFLOW_PAGE_LAYOUT;
    case DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT_ID:
      return DEFAULT_WORKFLOW_VERSION_PAGE_LAYOUT;
    case DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT_ID:
      return DEFAULT_WORKFLOW_RUN_PAGE_LAYOUT;
    case DEFAULT_MESSAGE_THREAD_RECORD_PAGE_LAYOUT_ID:
      return DEFAULT_MESSAGE_THREAD_RECORD_PAGE_LAYOUT;
    case DEFAULT_RECORD_PAGE_LAYOUT_ID:
    default:
      return DEFAULT_RECORD_PAGE_LAYOUT;
  }
};

export const useBasePageLayout = (
  pageLayoutId: string,
): PageLayout | undefined => {
  const isDefaultLayout = isDefaultPageLayoutId(pageLayoutId);
  const { objectMetadataItems } = useObjectMetadataItems();

  const cachedRecordPageLayout = useAtomFamilySelectorValue(
    recordPageLayoutFromIdFamilySelector,
    { pageLayoutId },
  );

  const shouldSkipQuery = isDefaultLayout || isDefined(cachedRecordPageLayout);

  const { data } = useQuery(FindOnePageLayoutDocument, {
    variables: {
      id: pageLayoutId,
    },
    skip: shouldSkipQuery,
  });

  if (isDefaultLayout) {
    return getDefaultLayoutById(pageLayoutId);
  }

  const pageLayout =
    cachedRecordPageLayout ??
    (isDefined(data?.getPageLayout)
      ? transformPageLayout(data.getPageLayout)
      : undefined);
  if (!pageLayout) return undefined;

  const object = objectMetadataItems.find(
    (item) => item.id === pageLayout.objectMetadataId,
  );
  return moveMessageListCampaignsToTab({
    pageLayout,
    objectNameSingular: object?.nameSingular,
    campaignsFieldId: object?.fields.find((field) => field.name === 'campaigns')
      ?.id,
  });
};
