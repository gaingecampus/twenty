import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { RecordTableScrollbars } from '@/object-record/record-table/components/RecordTableScrollbars';

const StyledScrollbars = styled(RecordTableScrollbars)`
  flex: none;
`;

const StyledScrollPort = styled.div`
  overflow-x: auto;
  width: 100%;
`;

export const MessageListTableScroll = ({
  tableId,
  label,
  children,
}: {
  tableId: string;
  label: string;
  children: ReactNode;
}) => (
  <StyledScrollbars recordTableId={tableId}>
    <StyledScrollPort
      id={`scroll-wrapper-record-table-scroll-${tableId}`}
      className="scroll-wrapper-x-enabled"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </StyledScrollPort>
  </StyledScrollbars>
);
