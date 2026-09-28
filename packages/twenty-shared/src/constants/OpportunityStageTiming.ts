// GAINGE customStage values; field names are shared with the database installer.
export const OPPORTUNITY_STAGE_TIMINGS = [
  { value: 'INQUIRY', label: '문의', key: 'Inquiry' },
  { value: 'COMMUNICATING', label: '초기 상담', key: 'Communicating' },
  { value: 'TECHNICAL_CONSULT', label: '기술 상담', key: 'TechnicalConsult' },
  { value: 'PROPOSAL', label: '제안/견적 (소통)', key: 'Proposal' },
  // Historical measurements remain readable; this is not an active stage option.
  { value: 'FOLLOW_UP', label: '팔로우업', key: 'FollowUp' },
  { value: 'ON_HOLD', label: '보류 (이유 포함)', key: 'OnHold' },
  {
    value: 'MATCHING_HOLD_COMPLETED',
    label: '종료 (26/7/31 미확인)',
    key: 'Closed',
  },
  { value: 'MATCHING_SUCCESS', label: '매칭 성공', key: 'MatchingSuccess' },
].map((stage) => ({
  ...stage,
  reachedAtField: `stage${stage.key}ReachedAt`,
  daysField: `stage${stage.key}Days`,
}));
