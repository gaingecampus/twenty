import { t } from '@lingui/core/macro';
import { FeatureFlagKey } from 'twenty-shared/types';

type AdminFeatureFlagMetadata = {
  label: string;
  description: string;
};

export const getAdminFeatureFlagMetadata = (
  key: string | null | undefined,
): AdminFeatureFlagMetadata => {
  const metadata: Record<FeatureFlagKey, AdminFeatureFlagMetadata> = {
    [FeatureFlagKey.IS_UNIQUE_INDEXES_ENABLED]: {
      label: t`중복 값 방지 인덱스 (이전 설정)`,
      description: t`고유 인덱스를 제어하던 설정입니다. 현재 버전에는 이 플래그를 사용하는 실행 로직이 없습니다.`,
    },
    [FeatureFlagKey.IS_JSON_FILTER_ENABLED]: {
      label: t`JSON 필드 필터`,
      description: t`레코드 목록의 필터 조건에서 JSON 형식 필드를 선택할 수 있게 합니다.`,
    },
    [FeatureFlagKey.IS_MARKETPLACE_SETTING_TAB_VISIBLE]: {
      label: t`앱 마켓플레이스 탭`,
      description: t`설정의 앱 화면에 마켓플레이스 탭을 표시해 설치 가능한 앱을 살펴볼 수 있게 합니다.`,
    },
    [FeatureFlagKey.IS_EMAIL_GROUP_ENABLED]: {
      label: t`단체 이메일`,
      description: t`단체 이메일 작성·발송과 발신 도메인, 수신 거부 항목을 관리하는 기능을 활성화합니다.`,
    },
    [FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED]: {
      label: t`다대다 관계`,
      description: t`중간 연결 테이블을 통해 여러 레코드를 서로 연결하는 다대다 관계를 설정하고 편집할 수 있게 합니다.`,
    },
    [FeatureFlagKey.IS_REST_METADATA_API_NEW_FORMAT_DIRECT]: {
      label: t`메타데이터 REST API 새 응답 형식`,
      description: t`오브젝트·필드 설정용 REST API가 새 응답 형식을 사용합니다. 변경 전 기존 API 연동의 호환성을 확인하세요.`,
    },
    [FeatureFlagKey.IS_LOGIC_FUNCTION_PREBUILT_MODE_ENABLED]: {
      label: t`로직 함수 사전 빌드 실행`,
      description: t`워크플로 코드 단계 등 로직 함수가 미리 빌드한 실행 파일을 사용할 수 있게 합니다. 함수별 실행 모드와 빌드가 준비되어야 합니다.`,
    },
    [FeatureFlagKey.IS_SETTINGS_DISCOVERY_HERO_ENABLED]: {
      label: t`설정 도움말 영상`,
      description: t`설정 화면의 안내 카드에 데모 영상을 열 수 있는 재생 버튼을 표시합니다.`,
    },
    [FeatureFlagKey.IS_MESSAGING_CALENDAR_WEBHOOK_ENABLED]: {
      label: t`메일·캘린더 웹훅 동기화`,
      description: t`Gmail·Google Calendar·Microsoft 365의 변경 알림으로 메일과 일정을 동기화합니다. 공급자별 웹훅 설정이 필요합니다.`,
    },
  };

  return key && Object.hasOwn(metadata, key)
    ? metadata[key as FeatureFlagKey]
    : {
        label: key ?? t`알 수 없는 기능 플래그`,
        description: t`아직 등록된 설명이 없습니다. 변경 전 해당 기능의 동작을 확인하세요.`,
      };
};
