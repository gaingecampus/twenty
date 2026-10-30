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
  variables = ['fullName', 'email'],
  disabled = false,
}: {
  onInsert: (text: string) => void;
  variables?: ('fullName' | 'email' | 'companyName')[];
  disabled?: boolean;
}) => {
  const { t } = useLingui();
  const id = useId();

  return (
    <StyledVariablePicker>
      <Select
        dropdownId={`campaign-body-variable-${id}`}
        dropdownWidth={260}
        value=""
        disabled={disabled}
        emptyOption={{ label: t`고객 정보 넣기`, value: '' }}
        options={variables.map((variable) => ({
          label:
            variable === 'fullName'
              ? t`고객 이름`
              : variable === 'companyName'
                ? t`기업`
                : t`이메일`,
          value: variable,
          contextualText: `{{${variable}}}`,
        }))}
        onChange={(value) => {
          if (value) onInsert(`{{${value}}}`);
        }}
      />
    </StyledVariablePicker>
  );
};
