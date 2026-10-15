import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { MessageChannelType, SettingsPath } from 'twenty-shared/types';
import { Callout } from 'twenty-ui/feedback';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

const StyledGuide = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  line-height: 1.6;
`;

const StyledDetails = styled.details`
  color: ${themeCssVariables.font.color.secondary};

  summary {
    color: ${themeCssVariables.font.color.primary};
    cursor: pointer;
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  p,
  ol {
    margin: ${themeCssVariables.spacing[3]} 0 0;
  }

  ol {
    padding-left: ${themeCssVariables.spacing[5]};
  }

  li + li {
    margin-top: ${themeCssVariables.spacing[2]};
  }
`;

export const SettingsWorkspaceEmailGuide = () => {
  const { t } = useLingui();
  const navigateSettings = useNavigateSettings();
  const { channels } = useMyMessageChannels();
  const hasDemoChannel = channels.some(
    (channel) =>
      channel.type === MessageChannelType.EMAIL_GROUP &&
      channel.handle.toLowerCase().endsWith('@demo.invalid'),
  );

  return (
    <Section>
      <StyledGuide>
        <Callout
          variant="info"
          title={t`이미 IMAP·SMTP로 연결했다면 추가 등록하지 않아도 됩니다`}
          description={t`사용자 이메일 설정은 CRM이 기존 메일함에 직접 접속해 메일을 가져오고 보내는 방식입니다. 아래 이메일 채널은 회사 메일을 CRM 전용 우체통으로 전달받는 별도의 방식입니다. 같은 주소를 두 곳에 모두 등록할 필요는 없습니다.`}
          action={{
            label: t`IMAP·SMTP 계정 설정 열기`,
            onClick: () => navigateSettings(SettingsPath.AccountsEmails),
          }}
        />
        <StyledDetails>
          <summary>{t`이메일 채널은 언제 쓰고, 어떻게 준비하나요?`}</summary>
          <p>{t`회사 공유 주소로 받은 메일을 CRM에 모아 팀과 함께 확인할 때 사용합니다. 메일함 로그인 대신 회사 메일 서비스의 자동 전달 기능을 이용하므로, 이 화면에서는 앱 비밀번호를 입력하지 않습니다.`}</p>
          <p>{t`메일이 들어오는 방향: 회사 메일 주소 → CRM 전달 주소 → CRM에 저장`}</p>
          <ol>
            <li>{t`관리자: 먼저 CRM이 메일을 받을 수 있는 진짜 우체통을 준비합니다. 수신용 도메인과 메일 수신·저장·알림 서비스를 CRM 서버에 연결하는 작업입니다.`}</li>
            <li>{t`사용자: 준비가 끝나면 이메일 채널을 등록합니다. CRM이 전달 주소를 자동으로 만들어 줍니다. 주소를 직접 만들 필요는 없습니다.`}</li>
            <li>{t`사용자 또는 메일 관리자: 회사 메일 서비스에 로그인해, 원본 주소로 들어온 메일을 CRM 전달 주소로 자동 전달하도록 설정합니다. CRM에 주소를 등록하는 것만으로 자동 전달되지는 않습니다.`}</li>
            <li>{t`확인: 원본 주소로 테스트 메일을 보내 CRM에 도착하는지 확인합니다.`}</li>
          </ol>
          <p>{t`이 채널로 메일을 보내거나 답장하려면 발송 서비스 연결과 발신 도메인 인증도 별도로 필요합니다. 기존 SMTP 계정으로 발송할 때는 이 채널을 추가하지 않아도 됩니다.`}</p>
          <p>{t`‘확인됨’은 발신 도메인의 인증 상태입니다. 자동 전달 설정이나 실제 메일 수신 성공을 뜻하지 않습니다.`}</p>
        </StyledDetails>
        {hasDemoChannel && (
          <Callout
            variant="warning"
            title={t`현재 데모용 전달 주소가 등록되어 있습니다`}
            description={t`@demo.invalid로 끝나는 주소는 연습용이라 실제 메일을 받을 수 없습니다. 관리자가 수신 환경을 준비한 뒤 실제 전달 주소가 있는 채널을 등록하고, 회사 메일 서비스에 그 주소를 설정하세요.`}
          />
        )}
      </StyledGuide>
    </Section>
  );
};
