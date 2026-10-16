import { EmailSignaturePreview } from '@/settings/accounts/components/EmailSignaturePreview';
import { useEmailSignature } from '@/settings/accounts/hooks/useEmailSignature';
import { TextArea } from '@/ui/input/components/TextArea';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { H2Title } from 'twenty-ui/typography';

export const SettingsEmailSignature = () => {
  const { signature, loading, error, saving, saveSignature } =
    useEmailSignature();
  const [draft, setDraft] = useState<string | null>(null);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const html = draft ?? signature;
  const handleSave = async () => {
    try {
      setDraft(await saveSignature(html));
      enqueueSuccessSnackBar({ message: '이메일 서명을 저장했습니다.' });
    } catch (saveError) {
      enqueueErrorSnackBar({
        message:
          saveError instanceof Error
            ? saveError.message
            : '서명을 저장하지 못했습니다.',
      });
    }
  };
  return (
    <Section>
      <H2Title
        title="내 이메일 서명"
        description="이 워크스페이스에서 내가 작성하는 새 심방콜 발송에 사용하는 명함입니다. 이름·직책·연락처·로고가 들어간 HTML을 등록하세요. 다른 회원의 서명과 별도로 저장됩니다."
      />
      {error ? (
        <p role="alert">
          서명을 불러오지 못했습니다. 새로 고침해 다시 시도해 주세요.
        </p>
      ) : (
        <>
          <TextArea
            textAreaId="email-signature-html"
            label="서명 HTML"
            value={html}
            onChange={setDraft}
            minRows={6}
            disabled={loading || saving}
            placeholder={
              '<p><strong>홍길동 | 컨설턴트</strong><br>가인지컨설팅그룹<br>이메일 · 전화번호</p>'
            }
          />
          <p>
            로고는 외부에서 열 수 있는 HTTPS 이미지 주소를 사용하세요. 빈
            내용으로 저장하면 서명이 삭제됩니다.
          </p>
          <EmailSignaturePreview html={html} />
          <Button
            title={saving ? '저장 중…' : '서명 저장'}
            onClick={handleSave}
            disabled={loading || saving || html.length > 50000}
          />
          {html.length > 50000 && (
            <p role="alert">50,000자 이하로 입력하세요.</p>
          )}
        </>
      )}
    </Section>
  );
};
