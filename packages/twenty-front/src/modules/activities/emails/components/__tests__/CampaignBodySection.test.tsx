import { CampaignBodySection } from '@/activities/emails/components/CampaignBodySection';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { render, screen } from '@testing-library/react';

jest.mock('@/object-record/hooks/useObjectPermissions', () => ({
  useObjectPermissions: jest.fn(),
}));
jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue',
  () => ({
    useAtomFamilySelectorValue: jest.fn(),
  }),
);

const renderBody = () =>
  render(
    <CampaignBodySection
      recordId="campaign"
      objectMetadataId="campaign-object"
      fieldMetadataId="body-field"
    />,
  );

beforeEach(() => {
  jest.mocked(useObjectPermissions).mockReturnValue({
    objectPermissionsByObjectMetadataId: {},
  } as ReturnType<typeof useObjectPermissions>);
  jest
    .mocked(useAtomFamilySelectorValue)
    .mockReturnValue(
      '<p>{{fullName}}님</p><p>발송한 내용<br>두 번째 줄</p><script>unsafe()</script>',
    );
});

it('shows the saved body with line breaks and personalization without executable markup', () => {
  renderBody();
  expect(screen.getByLabelText('발송 본문').textContent).toBe(
    '{{fullName}}님\n발송한 내용\n두 번째 줄',
  );
  expect(screen.getByLabelText('발송 본문').querySelector('script')).toBeNull();
});

it.each(['object', 'field'])(
  'does not expose a body with denied %s access',
  (denied) => {
    jest.mocked(useObjectPermissions).mockReturnValue({
      objectPermissionsByObjectMetadataId: {
        'campaign-object': {
          objectMetadataId: 'campaign-object',
          canReadObjectRecords: denied !== 'object',
          canUpdateObjectRecords: false,
          canSoftDeleteObjectRecords: false,
          canDestroyObjectRecords: false,
          rowLevelPermissionPredicates: [],
          rowLevelPermissionPredicateGroups: [],
          restrictedFields:
            denied === 'field' ? { 'body-field': { canRead: false } } : {},
        },
      },
    } as ReturnType<typeof useObjectPermissions>);
    renderBody();
    expect(screen.queryByLabelText('본문 미리보기')).not.toBeInTheDocument();
  },
);

it('distinguishes a loading body from an empty saved body', () => {
  jest.mocked(useAtomFamilySelectorValue).mockReturnValue(undefined);
  const { rerender } = renderBody();
  expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
  jest.mocked(useAtomFamilySelectorValue).mockReturnValue(null);
  rerender(
    <CampaignBodySection
      recordId="campaign"
      objectMetadataId="campaign-object"
      fieldMetadataId="body-field"
    />,
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByLabelText('발송 본문')).toHaveTextContent('본문 없음');
});
