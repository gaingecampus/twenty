import { StyledDispatchForm } from '@/activities/emails/components/CampaignDispatchStyles';
import { SmsCampaignComposer } from '@/activities/emails/components/SmsCampaignComposer';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';
import { SidePanelInformationBanner } from 'twenty-ui/feedback';
import { Button } from 'twenty-ui/input';
import { useState } from 'react';

export const SmsCampaignComposerContent = () => {
  const isSmsAvailable = useSmsDispatchAvailability();
  const [isPreview, setIsPreview] = useState(false);
  const canPreview = process.env.NODE_ENV === 'development';

  if (canPreview && isPreview) {
    return <SmsCampaignComposer isPreview />;
  }

  if (!isSmsAvailable) {
    return (
      <StyledDispatchForm role="alert">
        <SidePanelInformationBanner
          variant="warning"
          message="문자 발송을 사용할 수 없습니다. 관리자에게 문자 발송 설정과 사용 권한을 확인해 주세요."
        />
        {canPreview && (
          <Button
            title="문자 화면 미리보기"
            variant="secondary"
            size="small"
            onClick={() => setIsPreview(true)}
          />
        )}
      </StyledDispatchForm>
    );
  }

  return <SmsCampaignComposer />;
};
