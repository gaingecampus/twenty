import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildStatusBoardActiveOnboardingFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';

const metadata = {
  readableFields: [{ name: 'onboardingStatus' }],
} as EnrichedObjectMetadataItem;

describe('onboarding status filtering', () => {
  it('preserves the active-only default for existing metrics', () => {
    expect(
      buildStatusBoardActiveOnboardingFilter({
        onboardingObjectMetadataItem: metadata,
        memberIds: undefined,
      }),
    ).toEqual({ onboardingStatus: { eq: 'ACTIVE' } });
  });
  it('includes all PRE contracts without restricting them to the current month', () => {
    expect(
      buildStatusBoardActiveOnboardingFilter({
        onboardingObjectMetadataItem: metadata,
        memberIds: undefined,
        status: 'PRE',
      }),
    ).toEqual({ onboardingStatus: { eq: 'PRE' } });
  });
  it('does not expose contracts for an empty member selection', () => {
    expect(
      buildStatusBoardActiveOnboardingFilter({
        onboardingObjectMetadataItem: metadata,
        memberIds: [],
        status: 'PRE',
      }),
    ).toEqual({
      and: [{ onboardingStatus: { eq: 'PRE' } }, { id: { is: 'NULL' } }],
    });
  });
});
