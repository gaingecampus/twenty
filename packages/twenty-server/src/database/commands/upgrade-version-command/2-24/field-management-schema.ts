export const CONTRACT_GOAL_FIELDS = [
  { name: 'plannedSessionCount', label: '총 예정 회차', type: 'NUMBER' },
  { name: 'consultingGoal', label: '계약 목표', type: 'TEXT' },
  { name: 'successCriteria', label: '성공 기준', type: 'TEXT' },
];
export const FIELD_VISIT_FIELDS = [
  { name: 'visitDate', label: '현장 날짜', type: 'DATE' },
  { name: 'sessionNumber', label: '회차', type: 'NUMBER' },
  { name: 'activities', label: '수행 내용', type: 'TEXT' },
  { name: 'decisions', label: '논의·주요 결정', type: 'TEXT' },
  { name: 'nextActions', label: '다음 할 일', type: 'TEXT' },
  {
    name: 'recordStatus',
    label: '작성 상태',
    type: 'SELECT',
    defaultValue: "'DRAFT'",
    options: [
      {
        id: '4fe1a950-f2a8-4ccb-8c36-aeb04ad41101',
        value: 'DRAFT',
        label: '초안',
        color: 'gray',
        position: 0,
      },
      {
        id: '4fe1a950-f2a8-4ccb-8c36-aeb04ad41102',
        value: 'SUBMITTED',
        label: '제출',
        color: 'green',
        position: 1,
      },
    ],
  },
  { name: 'goalSnapshot', label: '제출 당시 계약 목표', type: 'TEXT' },
  { name: 'criteriaSnapshot', label: '제출 당시 성공 기준', type: 'TEXT' },
];

// SQL identifiers come only from workspace metadata, never from user input.
const quote = (name: string) => '"' + name.replace(/"/g, '""') + '"';
export const buildFieldVisitValidationSql = (
  schema: string,
  visitTable: string,
  contractTable: string,
) => {
  const ns = quote(schema);
  return `CREATE OR REPLACE FUNCTION ${ns}.validate_field_visit() RETURNS trigger LANGUAGE plpgsql AS $fn$
  DECLARE goal text; criteria text;
  BEGIN
    IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
    IF NEW."contractId" IS NULL THEN RAISE EXCEPTION '현장 기록의 계약을 선택해 주세요'; END IF;
    IF TG_OP='UPDATE' AND NEW."contractId" IS DISTINCT FROM OLD."contractId" THEN RAISE EXCEPTION '현장 기록의 계약은 변경할 수 없습니다'; END IF;
    SELECT "consultingGoal", "successCriteria" INTO goal, criteria FROM ${ns}.${quote(contractTable)} WHERE id=NEW."contractId" AND "deletedAt" IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION '사용 가능한 계약이 아닙니다'; END IF;
    IF NEW."recordStatus" IS NULL OR NEW."recordStatus" NOT IN ('DRAFT','SUBMITTED') THEN RAISE EXCEPTION '작성 상태가 올바르지 않습니다'; END IF;
    IF NEW."sessionNumber" IS NOT NULL AND (NEW."sessionNumber"<1 OR NEW."sessionNumber"<>floor(NEW."sessionNumber")) THEN RAISE EXCEPTION '회차는 1 이상의 정수여야 합니다'; END IF;
    IF NEW."recordStatus"='SUBMITTED' AND (NEW."visitDate" IS NULL OR COALESCE(trim(NEW.name),'')='' OR COALESCE(trim(NEW.activities),'')='') THEN RAISE EXCEPTION '제출하려면 제목, 현장 날짜, 수행 내용을 입력해 주세요'; END IF;
    IF TG_OP='INSERT' THEN
      NEW."goalSnapshot":=CASE WHEN NEW."recordStatus"='SUBMITTED' THEN goal ELSE NULL END;
      NEW."criteriaSnapshot":=CASE WHEN NEW."recordStatus"='SUBMITTED' THEN criteria ELSE NULL END;
    ELSE
      NEW."goalSnapshot":=OLD."goalSnapshot"; NEW."criteriaSnapshot":=OLD."criteriaSnapshot";
      IF OLD."recordStatus"='DRAFT' AND NEW."recordStatus"='SUBMITTED' THEN
        NEW."goalSnapshot":=goal; NEW."criteriaSnapshot":=criteria;
      END IF;
      IF OLD."recordStatus"='SUBMITTED' AND NEW."recordStatus"='DRAFT' THEN RAISE EXCEPTION '제출한 기록은 초안으로 되돌릴 수 없습니다'; END IF;
    END IF;
    RETURN NEW;
  END;$fn$;
  DROP TRIGGER IF EXISTS validate_field_visit ON ${ns}.${quote(visitTable)};
  CREATE TRIGGER validate_field_visit BEFORE INSERT OR UPDATE ON ${ns}.${quote(visitTable)} FOR EACH ROW EXECUTE FUNCTION ${ns}.validate_field_visit();
  CREATE INDEX IF NOT EXISTS field_visit_contract_date ON ${ns}.${quote(visitTable)} ("contractId", "visitDate" DESC) WHERE "deletedAt" IS NULL;`;
};
