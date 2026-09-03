import { Draggable } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

type ViewPickerReorderableTabProps = {
  children: ReactNode;
  draggableId: string;
  index: number;
  isDragDisabled?: boolean;
};

const StyledDraggableTab = styled.div`
  display: flex;
  flex-shrink: 0;
`;

export const ViewPickerReorderableTab = ({
  children,
  draggableId,
  index,
  isDragDisabled = false,
}: ViewPickerReorderableTabProps) => {
  return (
    <Draggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(draggableProvided, draggableSnapshot) => (
        <StyledDraggableTab
          ref={draggableProvided.innerRef}
          // oxlint-disable-next-line react/jsx-props-no-spreading
          {...draggableProvided.draggableProps}
          // oxlint-disable-next-line react/jsx-props-no-spreading
          {...draggableProvided.dragHandleProps}
          style={{
            ...draggableProvided.draggableProps.style,
            cursor: draggableSnapshot.isDragging
              ? 'grabbing'
              : isDragDisabled
                ? 'pointer'
                : 'grab',
          }}
        >
          {children}
        </StyledDraggableTab>
      )}
    </Draggable>
  );
};
