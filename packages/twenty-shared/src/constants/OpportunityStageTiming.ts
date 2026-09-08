// GAINGE customStage values; field names are shared with the database installer.
export const OPPORTUNITY_STAGE_TIMINGS = [
  { value: 'INQUIRY', label: '문의', key: 'Inquiry' },
  { value: 'COMMUNICATING', label: '초기 소통중', key: 'Communicating' },
  { value: 'TECHNICAL_CONSULT', label: '기술상담', key: 'TechnicalConsult' },
  { value: 'PROPOSAL', label: '제안', key: 'Proposal' },
  { value: 'FOLLOW_UP', label: '팔로우업', key: 'FollowUp' },
  { value: 'ON_HOLD', label: '보류', key: 'OnHold' },
  { value: 'MATCHING_HOLD_COMPLETED', label: '종료', key: 'Closed' },
  { value: 'MATCHING_SUCCESS', label: '매칭 성공', key: 'MatchingSuccess' },
].map((stage) => ({
  ...stage,
  reachedAtField: `stage${stage.key}ReachedAt`,
  daysField: `stage${stage.key}Days`,
}));
