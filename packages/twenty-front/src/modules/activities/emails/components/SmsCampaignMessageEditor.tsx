import { CampaignPlainTextMessageEditor } from '@/activities/emails/components/CampaignPlainTextMessageEditor';

export const SmsCampaignMessageEditor = ({
  value,
  onChange,
  disabled,
  isLongMessage,
  showCustomerInfo = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isLongMessage: boolean;
  showCustomerInfo?: boolean;
}) => (
  <CampaignPlainTextMessageEditor
    value={value}
    onChange={onChange}
    disabled={disabled}
    showCustomerInfo={showCustomerInfo}
    counter={
      <>
        {new TextEncoder().encode(value).length.toLocaleString()} / 2,000바이트
        · {isLongMessage ? 'LMS 장문' : 'SMS 단문'}
      </>
    }
  />
);
