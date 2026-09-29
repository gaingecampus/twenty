import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { PageLayoutType } from '~/generated-metadata/graphql';
import {
  isFieldManagementReady,
  useFieldManagementMetadata,
} from './useFieldManagementData';

export const FIELD_MANAGEMENT_RECORD_TAB_ID = 'gainge-field-records';

// Runtime tab only: never insert this extension into a saved user layout.
export const useFieldManagementRecordTab = (
  pageLayoutId: string,
  isEditMode: boolean,
): PageLayoutTab | undefined => {
  const { targetRecordIdentifier, layoutType } = useLayoutRenderingContext();
  const metadata = useFieldManagementMetadata();
  if (
    isEditMode ||
    layoutType !== PageLayoutType.RECORD_PAGE ||
    !['company', 'onboarding'].includes(
      targetRecordIdentifier?.targetObjectNameSingular ?? '',
    ) ||
    !isFieldManagementReady(metadata)
  )
    return undefined;

  return {
    __typename: 'PageLayoutTab',
    id: FIELD_MANAGEMENT_RECORD_TAB_ID,
    title: '현장 기록',
    icon: 'IconMap',
    pageLayoutId,
    applicationId: 'gainge-field-management',
    isActive: true,
    position: 1,
    widgets: [],
    createdAt: '2026-09-29T00:00:00.000Z',
    updatedAt: '2026-09-29T00:00:00.000Z',
    deletedAt: null,
  };
};
