import { Select } from '@/ui/input/components/Select';
import { useLingui } from '@lingui/react/macro';
import { useId } from 'react';
import { styled } from '@linaria/react';

const StyledVariablePicker = styled.div`
  align-self: flex-start;
  max-width: 100%;
`;

export const CampaignBodyVariablePicker = ({
  onInsert,
}: {
  onInsert: (text: string) => void;
}) => {
  const { t } = useLingui();
  const id = useId();

  return (
    <StyledVariablePicker>
      <Select
        dropdownId={`campaign-body-variable-${id}`}
        selectSizeVariant="small"
        dropdownWidth={260}
        value=""
        emptyOption={{ label: t`본문에 변수 넣기`, value: '' }}
        options={[
          { label: t`고객 이름` + ' · {{fullName}}', value: 'fullName' },
          { label: t`이메일` + ' · {{email}}', value: 'email' },
        ]}
        onChange={(value) => {
          if (value) onInsert(`{{${value}}}`);
        }}
      />
    </StyledVariablePicker>
  );
};
