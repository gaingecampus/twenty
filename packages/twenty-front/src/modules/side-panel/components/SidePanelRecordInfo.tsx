import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { viewableRecordNameSingularComponentState } from '@/side-panel/pages/record-page/states/viewableRecordNameSingularComponentState';
import { SidePanelPageInfoLayout } from '@/side-panel/components/SidePanelPageInfoLayout';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { useIcons } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

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
  const { getIcon } = useIcons();
  const Icon = getIcon(objectMetadataItem.icon);

  return (
    <SidePanelPageInfoLayout
      icon={<Icon size={24} />}
      iconColor={themeCssVariables.font.color.secondary}
      title={
        <OverflowingTextWithTooltip text={objectMetadataItem.labelPlural} />
      }
    />
  );
};
