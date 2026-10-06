import { FieldManagementPageContent } from '@/field-management/FieldManagementPageContent';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { StyledMyFieldsSurface } from '@/field-management/myFieldsStyled';
import { FieldManagement } from '@/field-management/FieldManagement';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
export const MyFieldsPage = () => (
  <PageContainer>
    <PageTitle title="컨설팅 품질 관리" />
    <PageCardLayout header={<PageCardHeader title="컨설팅 품질 관리" />}>
      <FieldManagementPageContent />
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

export const LegacyMyFieldsRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return (
    <Navigate
      replace
      to={`${pathname.replace(/^\/my-fields(?=\/|$)/, '/consulting-quality')}${search}${hash}`}
    />
  );
};
