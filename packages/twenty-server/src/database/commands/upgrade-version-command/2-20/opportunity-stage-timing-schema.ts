import { OPPORTUNITY_STAGE_TIMINGS } from 'twenty-shared/constants';

export const fields = [
  {
    name: 'stageTimingStartedAt',
    label: '단계 측정 시작일',
    type: 'DATE_TIME',
  },
  {
    name: 'stageTimingOriginAt',
    label: '단계 소요일 기준일',
    type: 'DATE_TIME',
  },
  ...OPPORTUNITY_STAGE_TIMINGS.flatMap((stage) => [
    {
      name: stage.reachedAtField,
      label: `${stage.label} 최초 관측일`,
      type: 'DATE_TIME',
    },
    {
      name: stage.daysField,
      label: `${stage.label} 도달 소요일`,
      type: 'NUMBER',
    },
  ]),
].map((field) => ({
  ...field,
  isNullable: true,
  icon: 'IconClock',
  description:
    '자동 측정. CRM 생성일부터 최초 관측 도달일까지 한국 날짜 기준 누적 일수(주말 포함). 기존 문의의 과거 도달 이력은 추정하지 않습니다.',
}));

export function buildStageTimingSql(schema: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema))
    throw new Error('Invalid workspace schema');
  const ns = `"${schema}"`;
  const preserve = fields
    .map(({ name }) => `NEW."${name}" := OLD."${name}";`)
    .join('\n');
  const initialize = fields
    .map(({ name }) => `NEW."${name}" := NULL;`)
    .join('\n');
  const branches = OPPORTUNITY_STAGE_TIMINGS.map(
    (stage) => `
    WHEN '${stage.value}' THEN
      IF NEW."${stage.reachedAtField}" IS NULL THEN
        NEW."${stage.reachedAtField}" := observed_at;
        NEW."${stage.daysField}" := (observed_at AT TIME ZONE 'Asia/Seoul')::date
          - (NEW."stageTimingOriginAt" AT TIME ZONE 'Asia/Seoul')::date;
      END IF;`,
  ).join('\n');
  return `
CREATE OR REPLACE FUNCTION ${ns}.gainge_measure_opportunity_stage()
RETURNS trigger LANGUAGE plpgsql AS $stage_timing$
DECLARE observed_at timestamptz := statement_timestamp();
BEGIN
  IF TG_OP = 'UPDATE' THEN
    ${preserve}
    IF NEW."customStage" IS NOT DISTINCT FROM OLD."customStage"
      OR NEW."deletedAt" IS NOT NULL OR OLD."deletedAt" IS NOT NULL THEN
      RETURN NEW;
    END IF;
  ELSE
    ${initialize}
    IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
    NEW."stageTimingStartedAt" := observed_at;
  END IF;
  IF NEW."customStage" IS NULL OR NEW."createdAt" IS NULL
    OR NEW."createdAt" > observed_at THEN RETURN NEW; END IF;
  NEW."stageTimingOriginAt" := COALESCE(NEW."stageTimingOriginAt", NEW."createdAt");
  NEW."stageTimingStartedAt" := COALESCE(NEW."stageTimingStartedAt", observed_at);
  CASE NEW."customStage"::text
    ${branches}
    ELSE NULL;
  END CASE;
  RETURN NEW;
END;
$stage_timing$;
DROP TRIGGER IF EXISTS gainge_opportunity_stage_timing ON ${ns}."opportunity";
CREATE TRIGGER gainge_opportunity_stage_timing
BEFORE INSERT OR UPDATE ON ${ns}."opportunity"
FOR EACH ROW EXECUTE FUNCTION ${ns}.gainge_measure_opportunity_stage();
`;
}
