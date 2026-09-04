import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { t } from '@lingui/core/macro';
import { IconTrash } from 'twenty-ui/icon';
import { useTheme } from 'twenty-ui/theme-constants';

export const TrashPageHeader = () => {
  const theme = useTheme();

  return (
    <PageCardHeader
      icon={<IconTrash size={theme.icon.size.xl} />}
      title={t`Trash`}
      actionButton={<SidePanelToggleButton />}
    />
  );
};
