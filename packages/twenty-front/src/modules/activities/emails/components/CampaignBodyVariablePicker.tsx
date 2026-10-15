import { Select } from '@/ui/input/components/Select';
import { useLingui } from '@lingui/react/macro';
import { useId } from 'react';

export const CampaignBodyVariablePicker = ({
  onInsert,
}: {
  onInsert: (text: string) => void;
}) => {
  const { t } = useLingui();
  const id = useId();

  return (
    <Select
      dropdownId={`campaign-body-variable-${id}`}
      selectSizeVariant="small"
      dropdownWidthAuto
      value=""
      emptyOption={{ label: t`본문에 변수 넣기`, value: '' }}
      options={[
        { label: t`고객 전체 이름` + ' · {{fullName}}', value: 'fullName' },
        { label: t`이름` + ' · {{firstName}}', value: 'firstName' },
        { label: t`성` + ' · {{lastName}}', value: 'lastName' },
        { label: t`이메일` + ' · {{email}}', value: 'email' },
      ]}
      onChange={(value) => {
        if (value) onInsert(`{{${value}}}`);
      }}
    />
  );
};
