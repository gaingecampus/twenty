import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';
import { type LayoutRenderingContextType } from '@/ui/layout/contexts/LayoutRenderingContext';
import { getTabListInstanceIdFromPageLayoutId } from './getTabListInstanceIdFromPageLayoutId';
import { isDefined } from 'twenty-shared/utils';

export const getTabListInstanceIdFromPageLayoutAndRecord = ({
  pageLayoutId,
  layoutType,
  targetRecordIdentifier,
}: {
  pageLayoutId: string;
  layoutType: LayoutRenderingContextType['layoutType'];
  targetRecordIdentifier?: TargetRecordIdentifier;
}) => {
  // Share the selected tab across records of the same object and layout.
  const objectName =
    layoutType === 'RECORD_PAGE'
      ? targetRecordIdentifier?.targetObjectNameSingular
      : undefined;
  const baseInstanceId = getTabListInstanceIdFromPageLayoutId(pageLayoutId);
  return isDefined(objectName)
    ? `${baseInstanceId}-${objectName}`
    : baseInstanceId;
};
