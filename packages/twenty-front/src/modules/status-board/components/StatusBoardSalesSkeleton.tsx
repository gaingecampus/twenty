import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[3]} 0;
`;
const StyledPlaceholder = styled.div<{ height: number }>`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.md};
  height: ${({ height }) => `${height}px`};
  width: 100%;
`;
const StyledColumns = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

export const StatusBoardSalesSkeleton = ({
  chart = true,
}: {
  chart?: boolean;
}) => (
  <StyledSkeleton
    role="status"
    aria-label="매출 정보를 불러오는 중입니다"
    aria-busy="true"
  >
    <StyledColumns aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <StyledPlaceholder key={item} height={48} />
      ))}
    </StyledColumns>
    {chart && <StyledPlaceholder aria-hidden="true" height={280} />}
  </StyledSkeleton>
);
