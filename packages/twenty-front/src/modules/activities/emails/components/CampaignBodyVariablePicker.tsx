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
        dropdownWidth={260}
        value=""
        emptyOption={{ label: t`고객 정보 넣기`, value: '' }}
        options={[
          {
            label: t`고객 이름`,
            value: 'fullName',
            contextualText: '{{fullName}}',
          },
          { label: t`이메일`, value: 'email', contextualText: '{{email}}' },
        ]}
        onChange={(value) => {
          if (value) onInsert(`{{${value}}}`);
        }}
      />
    </StyledVariablePicker>
  );
};
