import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/layout';
import { H2Title } from 'twenty-ui/typography';

export const SettingsWorkspaceTheme = () => {
  const { t } = useLingui();

  return (
    <Section>
      <H2Title
        title={t`엔터프라이즈 테마`}
        description={t`모든 화면에 동일한 기본 디자인을 적용합니다. 라이트·다크 모드는 개인 설정에서 변경할 수 있습니다.`}
      />
    </Section>
  );
};
