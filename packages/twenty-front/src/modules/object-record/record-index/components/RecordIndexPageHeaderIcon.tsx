import { ObjectMetadataIcon } from '@/object-metadata/components/ObjectMetadataIcon';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { isDefined } from 'twenty-shared/utils';
import { useTheme } from 'twenty-ui/theme-constants';

export const RecordIndexPageHeaderIcon = ({
  objectMetadataItem,
}: {
  objectMetadataItem?: EnrichedObjectMetadataItem;
}) => {
  const theme = useTheme();

  if (!isDefined(objectMetadataItem)) {
    return null;
  }

  return (
    <ObjectMetadataIcon
      objectMetadataItem={objectMetadataItem}
      size={theme.icon.size.xl}
    />
  );
};
