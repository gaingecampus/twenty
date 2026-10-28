import { ObjectMetadataIcon } from '@/object-metadata/components/ObjectMetadataIcon';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { viewableRecordNameSingularComponentState } from '@/side-panel/pages/record-page/states/viewableRecordNameSingularComponentState';
import { SidePanelPageInfoLayout } from '@/side-panel/components/SidePanelPageInfoLayout';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';

export const SidePanelRecordInfo = ({
  sidePanelPageInstanceId,
}: {
  sidePanelPageInstanceId: string;
}) => {
  const viewableRecordNameSingular = useAtomComponentStateValue(
    viewableRecordNameSingularComponentState,
    sidePanelPageInstanceId,
  );
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: viewableRecordNameSingular!,
  });

  return (
    <SidePanelPageInfoLayout
      icon={
        <ObjectMetadataIcon objectMetadataItem={objectMetadataItem} size={20} />
      }
      title={
        <OverflowingTextWithTooltip text={objectMetadataItem.labelPlural} />
      }
    />
  );
};
