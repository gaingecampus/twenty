// customStage 옵션 value. 진행 중 문의에서 보류·종료·매칭 성공을 뺀다.
export const STATUS_BOARD_CLOSED_OPPORTUNITY_STAGES = [
  'ON_HOLD',
  'MATCHING_HOLD_COMPLETED',
  'MATCHING_SUCCESS',
] as const;
