import { WidgetHeaderTitleContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderTitleContext';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
  white-space: nowrap;
`;

export const MessageListHeaderCount = ({
  count,
  loading,
  error,
  label,
}: {
  count: number;
  loading: boolean;
  error: boolean;
  label: string;
}) => {
  const target = useContext(WidgetHeaderTitleContext);
  const value = loading ? '…' : error ? '—' : count.toLocaleString('ko-KR');
  const content = (
    <StyledCount aria-label={`${label} ${value}`}>
      {target ? value : `${label} ${value}`}
    </StyledCount>
  );
  return target ? createPortal(content, target) : content;
};
