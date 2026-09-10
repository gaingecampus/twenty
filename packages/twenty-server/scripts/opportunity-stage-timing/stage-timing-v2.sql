
CREATE OR REPLACE FUNCTION "gainge_workspace".gainge_measure_opportunity_stage()
RETURNS trigger LANGUAGE plpgsql AS $stage_timing$
DECLARE
  observed_at timestamptz := statement_timestamp();
  inquiry_date date := NULLIF(to_jsonb(NEW)->>'firstInquiryDate', '')::date;
  stage_changed boolean := true;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW."stageTimingStartedAt" := OLD."stageTimingStartedAt";
NEW."stageTimingOriginAt" := OLD."stageTimingOriginAt";
NEW."stageInquiryReachedAt" := OLD."stageInquiryReachedAt";
NEW."stageInquiryDays" := OLD."stageInquiryDays";
NEW."stageCommunicatingReachedAt" := OLD."stageCommunicatingReachedAt";
NEW."stageCommunicatingDays" := OLD."stageCommunicatingDays";
NEW."stageTechnicalConsultReachedAt" := OLD."stageTechnicalConsultReachedAt";
NEW."stageTechnicalConsultDays" := OLD."stageTechnicalConsultDays";
NEW."stageProposalReachedAt" := OLD."stageProposalReachedAt";
NEW."stageProposalDays" := OLD."stageProposalDays";
NEW."stageFollowUpReachedAt" := OLD."stageFollowUpReachedAt";
NEW."stageFollowUpDays" := OLD."stageFollowUpDays";
NEW."stageOnHoldReachedAt" := OLD."stageOnHoldReachedAt";
NEW."stageOnHoldDays" := OLD."stageOnHoldDays";
NEW."stageClosedReachedAt" := OLD."stageClosedReachedAt";
NEW."stageClosedDays" := OLD."stageClosedDays";
NEW."stageMatchingSuccessReachedAt" := OLD."stageMatchingSuccessReachedAt";
NEW."stageMatchingSuccessDays" := OLD."stageMatchingSuccessDays";
    NEW."sotongWanryoIlja" := OLD."sotongWanryoIlja";
    IF NEW."deletedAt" IS NOT NULL OR OLD."deletedAt" IS NOT NULL THEN
      RETURN NEW;
    END IF;
    stage_changed := NEW."customStage" IS DISTINCT FROM OLD."customStage";
    IF NOT stage_changed AND inquiry_date IS NOT DISTINCT FROM
      NULLIF(to_jsonb(OLD)->>'firstInquiryDate', '')::date THEN RETURN NEW; END IF;
  ELSE
    NEW."stageTimingStartedAt" := NULL;
NEW."stageTimingOriginAt" := NULL;
NEW."stageInquiryReachedAt" := NULL;
NEW."stageInquiryDays" := NULL;
NEW."stageCommunicatingReachedAt" := NULL;
NEW."stageCommunicatingDays" := NULL;
NEW."stageTechnicalConsultReachedAt" := NULL;
NEW."stageTechnicalConsultDays" := NULL;
NEW."stageProposalReachedAt" := NULL;
NEW."stageProposalDays" := NULL;
NEW."stageFollowUpReachedAt" := NULL;
NEW."stageFollowUpDays" := NULL;
NEW."stageOnHoldReachedAt" := NULL;
NEW."stageOnHoldDays" := NULL;
NEW."stageClosedReachedAt" := NULL;
NEW."stageClosedDays" := NULL;
NEW."stageMatchingSuccessReachedAt" := NULL;
NEW."stageMatchingSuccessDays" := NULL;
    NEW."sotongWanryoIlja" := NULL;
    IF NEW."deletedAt" IS NOT NULL THEN RETURN NEW; END IF;
    NEW."stageTimingStartedAt" := observed_at;
  END IF;
  NEW."stageTimingOriginAt" := inquiry_date::timestamp AT TIME ZONE 'Asia/Seoul';
  IF stage_changed THEN
    NEW."stageTimingStartedAt" := COALESCE(NEW."stageTimingStartedAt", observed_at);
    CASE NEW."customStage"::text
      
    WHEN 'INQUIRY' THEN
      IF NEW."stageInquiryReachedAt" IS NULL THEN
        NEW."stageInquiryReachedAt" := observed_at;
      END IF;

    WHEN 'COMMUNICATING' THEN
      IF NEW."stageCommunicatingReachedAt" IS NULL THEN
        NEW."stageCommunicatingReachedAt" := observed_at;
      END IF;

    WHEN 'TECHNICAL_CONSULT' THEN
      IF NEW."stageTechnicalConsultReachedAt" IS NULL THEN
        NEW."stageTechnicalConsultReachedAt" := observed_at;
      END IF;

    WHEN 'PROPOSAL' THEN
      IF NEW."stageProposalReachedAt" IS NULL THEN
        NEW."stageProposalReachedAt" := observed_at;
      END IF;

    WHEN 'FOLLOW_UP' THEN
      IF NEW."stageFollowUpReachedAt" IS NULL THEN
        NEW."stageFollowUpReachedAt" := observed_at;
      END IF;

    WHEN 'ON_HOLD' THEN
      IF NEW."stageOnHoldReachedAt" IS NULL THEN
        NEW."stageOnHoldReachedAt" := observed_at;
      END IF;

    WHEN 'MATCHING_HOLD_COMPLETED' THEN
      IF NEW."stageClosedReachedAt" IS NULL THEN
        NEW."stageClosedReachedAt" := observed_at;
      END IF;

    WHEN 'MATCHING_SUCCESS' THEN
      IF NEW."stageMatchingSuccessReachedAt" IS NULL THEN
        NEW."stageMatchingSuccessReachedAt" := observed_at;
      END IF;
      ELSE NULL;
    END CASE;
    IF NEW."customStage"::text IN ('ON_HOLD', 'MATCHING_HOLD_COMPLETED', 'MATCHING_SUCCESS')
      AND NEW."sotongWanryoIlja" IS NULL THEN
      NEW."sotongWanryoIlja" := (observed_at AT TIME ZONE 'Asia/Seoul')::date;
    END IF;
  END IF;
  
  NEW."stageInquiryDays" := CASE
    WHEN NEW."stageInquiryReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageInquiryReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageInquiryReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageCommunicatingDays" := CASE
    WHEN NEW."stageCommunicatingReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageCommunicatingReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageCommunicatingReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageTechnicalConsultDays" := CASE
    WHEN NEW."stageTechnicalConsultReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageTechnicalConsultReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageTechnicalConsultReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageProposalDays" := CASE
    WHEN NEW."stageProposalReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageProposalReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageProposalReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageFollowUpDays" := CASE
    WHEN NEW."stageFollowUpReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageFollowUpReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageFollowUpReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageOnHoldDays" := CASE
    WHEN NEW."stageOnHoldReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageOnHoldReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageOnHoldReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageClosedDays" := CASE
    WHEN NEW."stageClosedReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageClosedReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageClosedReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;

  NEW."stageMatchingSuccessDays" := CASE
    WHEN NEW."stageMatchingSuccessReachedAt" IS NOT NULL AND inquiry_date IS NOT NULL
      AND (NEW."stageMatchingSuccessReachedAt" AT TIME ZONE 'Asia/Seoul')::date >= inquiry_date
    THEN (NEW."stageMatchingSuccessReachedAt" AT TIME ZONE 'Asia/Seoul')::date - inquiry_date
    ELSE NULL END;
  RETURN NEW;
END;
$stage_timing$;
DROP TRIGGER IF EXISTS gainge_opportunity_stage_timing ON "gainge_workspace"."opportunity";
CREATE TRIGGER gainge_opportunity_stage_timing
BEFORE INSERT OR UPDATE ON "gainge_workspace"."opportunity"
FOR EACH ROW EXECUTE FUNCTION "gainge_workspace".gainge_measure_opportunity_stage();
