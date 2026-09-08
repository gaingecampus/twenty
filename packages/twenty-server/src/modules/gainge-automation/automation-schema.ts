export const AUTOMATION_TARGETS = [
  {
    table: 'company',
    dri: 'driMemberId',
    link: 'companyGuseongweonLink',
    parent: 'companyId',
  },
  {
    table: 'person',
    dri: 'driMemberId',
    link: 'personGuseongweonLink',
    parent: 'personId',
  },
  {
    table: 'opportunity',
    dri: 'assigneeId',
    link: 'opportunityGuseongweonLink',
    parent: 'opportunityId',
  },
  {
    table: 'onboarding',
    dri: 'executionConsultantId',
    link: 'gyeyagGuseongweonLink',
    parent: 'gyeyagId',
  },
] as const;

export function quoteAutomationSchema(schema: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema))
    throw new Error('Invalid workspace schema');
  return `"${schema}"`;
}

export function buildAutomationSql(
  schema: string,
  targets: readonly (typeof AUTOMATION_TARGETS)[number][],
) {
  const ns = quoteAutomationSchema(schema);
  return `
CREATE TABLE IF NOT EXISTS ${ns}."_gaingeAutomationBudget" (day date PRIMARY KEY,calls int NOT NULL);
CREATE TABLE IF NOT EXISTS ${ns}."_gaingeAutomationEvent" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recordId" uuid NOT NULL, "objectName" text NOT NULL, kind text NOT NULL,
  payload jsonb NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
  "enrichmentStatus" text NOT NULL DEFAULT 'PENDING', "chatStatus" text NOT NULL DEFAULT 'PENDING',
  "enrichmentAttempts" int NOT NULL DEFAULT 0, "chatAttempts" int NOT NULL DEFAULT 0,
  "nextAttemptAt" timestamptz NOT NULL DEFAULT now(), "lastError" text,
  "leaseUntil" timestamptz, "leaseId" uuid, "completedAt" timestamptz,
  "sentDestinations" jsonb NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS gainge_automation_pending ON ${ns}."_gaingeAutomationEvent" ("nextAttemptAt") WHERE "completedAt" IS NULL;
${targets
  .map(
    (t) => `
CREATE OR REPLACE FUNCTION ${ns}.gainge_assign_${t.table}() RETURNS trigger LANGUAGE plpgsql AS $assign$
DECLARE actor_id uuid; member_ids uuid[]; row_json jsonb; actor_source text;
BEGIN
  IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
  row_json := to_jsonb(NEW);
  actor_source := CASE WHEN TG_OP='INSERT' THEN row_json->>'createdBySource' ELSE row_json->>'updatedBySource' END;
  IF actor_source IS DISTINCT FROM 'MANUAL' THEN RETURN NEW; END IF;
  actor_id := (CASE WHEN TG_OP='INSERT' THEN row_json->>'createdByWorkspaceMemberId' ELSE row_json->>'updatedByWorkspaceMemberId' END)::uuid;
  SELECT array_agg(id) INTO member_ids FROM ${ns}."teamMember" WHERE "workspaceMemberAccountId"=actor_id AND "deletedAt" IS NULL;
  IF cardinality(member_ids)=1 AND NEW."${t.dri}" IS NULL THEN NEW."${t.dri}" := member_ids[1]; END IF;
  RETURN NEW;
END;$assign$;
DROP TRIGGER IF EXISTS gainge_assign_owner ON ${ns}."${t.table}";
CREATE TRIGGER gainge_assign_owner BEFORE INSERT OR UPDATE ON ${ns}."${t.table}" FOR EACH ROW EXECUTE FUNCTION ${ns}.gainge_assign_${t.table}();
CREATE OR REPLACE FUNCTION ${ns}.gainge_record_${t.table}() RETURNS trigger LANGUAGE plpgsql AS $record$
DECLARE actor_id uuid; member_ids uuid[]; j jsonb; old_j jsonb; actor_source text; changed_fields text[]; stage_key text; event_kind text; actor_name text;
BEGIN
  IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
  j:=to_jsonb(NEW);
  actor_source := CASE WHEN TG_OP='INSERT' THEN j->>'createdBySource' ELSE j->>'updatedBySource' END;
  actor_id := (CASE WHEN TG_OP='INSERT' THEN j->>'createdByWorkspaceMemberId' ELSE j->>'updatedByWorkspaceMemberId' END)::uuid;
  actor_name := CASE WHEN TG_OP='INSERT' THEN j->>'createdByName' ELSE j->>'updatedByName' END;
  IF actor_source='MANUAL' THEN
    SELECT array_agg(id) INTO member_ids FROM ${ns}."teamMember" WHERE "workspaceMemberAccountId"=actor_id AND "deletedAt" IS NULL;
    IF cardinality(member_ids)=1 AND NEW."${t.dri}" IS DISTINCT FROM member_ids[1] THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('${t.table}:' || NEW.id::text,0));
      INSERT INTO ${ns}."${t.link}" ("${t.parent}","guseongweonId","createdBySource","createdByName")
        SELECT NEW.id,member_ids[1],'SYSTEM','CRM 담당자 자동 배정'
        WHERE NOT EXISTS(SELECT 1 FROM ${ns}."${t.link}" WHERE "${t.parent}"=NEW.id AND "guseongweonId"=member_ids[1] AND "deletedAt" IS NULL);
    END IF;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF actor_source IN ('SYSTEM','AGENT','WORKFLOW') THEN RETURN NEW; END IF;
    old_j:=to_jsonb(OLD);
    SELECT array_agg(key ORDER BY key) INTO changed_fields FROM jsonb_each(j) WHERE value IS DISTINCT FROM old_j->key
      AND key NOT IN ('updatedAt','searchVector','position') AND key NOT LIKE 'updatedBy%' AND key NOT LIKE 'stage%';
    IF changed_fields IS NULL THEN RETURN NEW; END IF;
  END IF;
  stage_key := CASE WHEN TG_TABLE_NAME='opportunity' THEN 'customStage' WHEN TG_TABLE_NAME='onboarding' THEN 'onboardingStatus' ELSE '' END;
  event_kind := CASE WHEN TG_OP='INSERT' THEN 'CREATED' WHEN stage_key=ANY(changed_fields) THEN 'STATUS_CHANGED' ELSE 'UPDATED' END;
  INSERT INTO ${ns}."_gaingeAutomationEvent"("recordId","objectName",kind,payload,"enrichmentStatus") VALUES
    (NEW.id,TG_TABLE_NAME,event_kind,jsonb_build_object('name',COALESCE(j->>'name',trim(COALESCE(j->>'nameFirstName','') || ' ' || COALESCE(j->>'nameLastName',''))),'driId',NEW."${t.dri}",'actorId',actor_id,'actorName',actor_name,'actorSource',actor_source,'changedFields',changed_fields,'beforeStage',old_j->>stage_key,'afterStage',j->>stage_key,'driResult',CASE WHEN actor_source IS DISTINCT FROM 'MANUAL' THEN 'NON_MANUAL' WHEN cardinality(member_ids)=1 THEN 'ASSIGNED_OR_COLLABORATOR' ELSE 'ACCOUNT_MAPPING_MISSING_OR_AMBIGUOUS' END),
    CASE WHEN TG_TABLE_NAME='company' AND TG_OP='INSERT' THEN 'PENDING' ELSE 'NOT_APPLICABLE' END);
  RETURN NEW;
END;$record$;
DROP TRIGGER IF EXISTS gainge_record_automation ON ${ns}."${t.table}";
CREATE TRIGGER gainge_record_automation AFTER INSERT OR UPDATE ON ${ns}."${t.table}" FOR EACH ROW EXECUTE FUNCTION ${ns}.gainge_record_${t.table}();
`,
  )
  .join('\n')}`;
}
