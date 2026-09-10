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
    '자동 측정. 최초 문의 날짜부터 최초 관측 도달일까지 한국 날짜 기준 누적 일수(주말 포함). 문의 날짜가 없거나 도달일보다 미래이면 소요일을 비웁니다. 검증된 기존 날짜는 이전할 수 있습니다.',
}));

export const communicationCompletionField = {
  name: 'sotongWanryoIlja',
  label: '소통 완료 일자',
  type: 'DATE',
  isNullable: true,
  icon: 'IconCalendarCheck',
  description: '보류·종료·매칭 성공 단계에 최초 도달한 한국 날짜. 재진입해도 유지합니다.',
};

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
      END IF;`,
  ).join('\n');
  const recomputeDays = OPPORTUNITY_STAGE_TIMINGS.map(
    (stage) => `
  NEW."${stage.daysField}" := CASE
    WHEN NEW."${stage.reachedAtField}" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."${stage.reachedAtField}" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."${stage.reachedAtField}" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;`,
  ).join('\n');
  return `
CREATE OR REPLACE FUNCTION ${ns}.gainge_measure_opportunity_stage()
RETURNS trigger LANGUAGE plpgsql AS $stage_timing$
DECLARE
  observed_at timestamptz := statement_timestamp();
  inquiry_date date := NULLIF(to_jsonb(NEW)->>'firstInquiryDate', '')::date;
  stage_changed boolean := true;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    ${preserve}
    NEW."sotongWanryoIlja" := OLD."sotongWanryoIlja";
    IF NEW."deletedAt" IS NOT NULL OR OLD."deletedAt" IS NOT NULL THEN
      RETURN NEW;
    END IF;
    stage_changed := NEW."customStage" IS DISTINCT FROM OLD."customStage";
    IF NOT stage_changed AND inquiry_date IS NOT DISTINCT FROM
      NULLIF(to_jsonb(OLD)->>'firstInquiryDate', '')::date THEN RETURN NEW; END IF;
  ELSE
    ${initialize}
    NEW."sotongWanryoIlja" := NULL;
    IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
    NEW."stageTimingStartedAt" := observed_at;
  END IF;
  NEW."stageTimingOriginAt" := inquiry_date::timestamp AT TIME ZONE 'Asia/Seoul';
  IF stage_changed THEN
    NEW."stageTimingStartedAt" := COALESCE(NEW."stageTimingStartedAt", observed_at);
    CASE NEW."customStage"::text
      ${branches}
      ELSE NULL;
    END CASE;
    IF NEW."customStage"::text IN ('ON_HOLD', 'MATCHING_HOLD_COMPLETED', 'MATCHING_SUCCESS')
      AND NEW."sotongWanryoIlja" IS NULL THEN
      NEW."sotongWanryoIlja" := (observed_at AT TIME ZONE 'Asia/Seoul')::date;
    END IF;
  END IF;
  ${recomputeDays}
  RETURN NEW;
END;
$stage_timing$;
DROP TRIGGER IF EXISTS gainge_opportunity_stage_timing ON ${ns}."opportunity";
CREATE TRIGGER gainge_opportunity_stage_timing
BEFORE INSERT OR UPDATE ON ${ns}."opportunity"
FOR EACH ROW EXECUTE FUNCTION ${ns}.gainge_measure_opportunity_stage();
`;
}
