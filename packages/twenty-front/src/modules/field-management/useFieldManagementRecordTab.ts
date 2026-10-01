import { v5 } from 'uuid';
import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { PageLayoutType } from '~/generated-metadata/graphql';
import {
  isFieldManagementReady,
  useFieldManagementMetadata,
} from './useFieldManagementData';

export const FIELD_MANAGEMENT_RECORD_TAB_ID = 'gainge-field-records';

export const getFieldManagementRecordTabId = (pageLayoutId: string) =>
  v5(`gainge-field-records:${pageLayoutId}`, v5.URL);

// A deterministic UUID lets the built-in tab use the normal layout save API.
export const useFieldManagementRecordTab = (
  pageLayoutId: string,
): PageLayoutTab | undefined => {
  const { targetRecordIdentifier, layoutType } = useLayoutRenderingContext();
  const metadata = useFieldManagementMetadata();
  if (
    layoutType !== PageLayoutType.RECORD_PAGE ||
    !['company', 'onboarding'].includes(
      targetRecordIdentifier?.targetObjectNameSingular ?? '',
    ) ||
    !isFieldManagementReady(metadata)
  )
    return undefined;

  return {
    __typename: 'PageLayoutTab',
    id: getFieldManagementRecordTabId(pageLayoutId),
    title: '현장 기록',
    icon: 'IconMap',
    pageLayoutId,
    applicationId: '',
    isActive: true,
    position: 1,
    widgets: [],
    createdAt: '2026-09-29T00:00:00.000Z',
    updatedAt: '2026-09-29T00:00:00.000Z',
    deletedAt: null,
  };
};
