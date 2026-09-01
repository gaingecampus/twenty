import { SettingsRadioCardContainer } from '@/settings/components/SettingsRadioCardContainer';
import { useWorkspaceUiTheme } from '@/settings/workspace/hooks/useWorkspaceUiTheme';
import { useLingui } from '@lingui/react/macro';
import {
  isUiThemeId,
  UI_THEME_IDS,
  type UiThemeId,
} from 'twenty-shared/constants';
import {
  IconBuildingSkyscraper,
  IconColorSwatch,
  type IconComponent,
} from 'twenty-ui/icon';
import { Section } from 'twenty-ui/layout';
import { H2Title } from 'twenty-ui/typography';

export const SettingsWorkspaceUiThemePicker = () => {
  const { t } = useLingui();
  const { uiTheme, setUiTheme } = useWorkspaceUiTheme();

  const themeOptionById: Record<
    UiThemeId,
    {
      title: string;
      description: string;
      Icon: IconComponent;
    }
  > = {
    default: {
      title: t`Default`,
      description: t`The current Twenty look`,
      Icon: IconColorSwatch,
    },
    enterprise: {
      title: t`Enterprise`,
      description: t`Pretendard, royal-blue navigation, rounded toolbar chips`,
      Icon: IconBuildingSkyscraper,
    },
  };

  const handleSelect = (value: string) => {
    if (!isUiThemeId(value)) {
      return;
    }

    void setUiTheme(value);
  };

  return (
    <Section>
      <H2Title
        title={t`Theme`}
        description={t`Applies to everyone in this workspace. Light and dark stay a personal setting.`}
      />
      <SettingsRadioCardContainer
        value={uiTheme}
        onChange={handleSelect}
        options={UI_THEME_IDS.map((themeId) => ({
          value: themeId,
          title: themeOptionById[themeId].title,
          description: themeOptionById[themeId].description,
          Icon: themeOptionById[themeId].Icon,
        }))}
      />
    </Section>
  );
};
