import { useParams } from 'react-router-dom';
import { StyledMyFieldsSurface } from '@/field-management/myFieldsStyled';
import { FieldManagement } from '@/field-management/FieldManagement';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
export const MyFieldsPage = () => (
  <PageContainer>
    <PageTitle title="나의 현장" />
    <PageCardLayout header={<PageCardHeader title="나의 현장" />}>
      <StyledMyFieldsSurface>
        <FieldManagement />
      </StyledMyFieldsSurface>
    </PageCardLayout>
  </PageContainer>
);

export const FieldVisitDetailPage = () => {
  const { visitId } = useParams();
  return (
    <PageContainer>
      <PageTitle title="현장 기록" />
      <PageCardLayout header={<PageCardHeader title="현장 기록" />}>
        <StyledMyFieldsSurface>
          <FieldManagement key={visitId} scope={{ visit: visitId }} />
        </StyledMyFieldsSurface>
      </PageCardLayout>
    </PageContainer>
  );
};
