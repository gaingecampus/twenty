import { type CampaignDraft } from 'twenty-shared/types';

export type CampaignDraftReference = { id: string; version: string };
export type CampaignDraftControls = {
  initialDraft?: CampaignDraft | null;
  draftReference?: CampaignDraftReference;
  saveDraft?: (fields: Partial<CampaignDraft>) => Promise<void>;
  savingDraft?: boolean;
};
