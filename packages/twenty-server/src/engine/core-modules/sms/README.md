# 가인지 SMS/LMS 연동 (AX-679)

CRM → 가인지 API → 발송 이력 DB + SQS → 별도 SMS 워커 → 뿌리오 순서로 처리한다.
CRM에서 뿌리오나 SQS에 직접 요청하지 않는다. SMS 워커는 HTTP API 서버가 아니며,
운영 큐의 refKey에 대응하는 발송 DB 행이 없으면 발송하지 않는다.

## 확인한 소스

2026-10-30 각 저장소의 dev 브랜치를 확인했다. 운영 배포 버전 일치 여부는 별도 확인이 필요하다.

- [gainge-200 어드민 클라이언트](https://github.com/gaingecampus/gainge-200/blob/dev/admin/inc/lib/messaging/messages_client.php): `/admin/messages/sms`를 campus API 클라이언트로 호출한다.
- [Moon-Gainge-Back 컨트롤러](https://github.com/gaingecampus/Moon-Gainge-Back/blob/dev/src/modules/apis/messages/messages.admin.api.controller.ts): `POST /api/admin/messages/sms`, Admin 인증.
- [API DTO](https://github.com/gaingecampus/Moon-Gainge-Back/blob/dev/src/modules/apis/messages/dtos/admin-send-sms.dto.ts): `content`, `targets[{to,name,var1…var8}]`, 선택 `subject`, `rejectType: AD`, `duplicateFlag: Y|N`.
- [SMS provider](https://github.com/gaingecampus/Moon-Gainge-Back/blob/dev/src/modules/providers/message/sms/sms-provider.service.ts): DB 이력 저장 후 SQS 적재, 단일 대상은 실시간 큐, 복수 대상은 최대 200명/240KB 단위 배치 큐.
- [SMS 워커](https://github.com/gaingecampus/Moon-Gainge-Back-SMS/blob/dev/src/workers/sms/sms.worker.service.ts): DB 행 claim 후 발송. 제목 존재, 템플릿 UTF-8 90바이트 초과, 또는 이름 4자 초과이면 LMS.

## 설정과 노출 조건

CRM API와 CRM 큐 워커에 동일한 환경변수 또는 관리자 구성 변수를 적용한다.

| 변수 | 값 |
| --- | --- |
| `GAINGE_SMS_ENABLED` | 기본 `false`. 아래 준비 확인 후 명시적으로 `true` |
| `GAINGE_SMS_API_URL` | `https://<가인지 API 호스트>/api/admin/messages/sms` 전체 주소 |
| `GAINGE_SMS_AUTH_HEADER` | API 서버의 `SECRET_HEADER`와 같은 인증 헤더 이름 |
| `GAINGE_SMS_AUTH_TOKEN` | API 서버의 `SECRET_KEY_ADMIN`에 대응하는 값. 민감 값, 서버 전용 |
| `GAINGE_SMS_WORKSPACE_ID` | 허용할 CRM 워크스페이스 UUID |

준비 확인: 해당 환경의 API 배포 및 Admin 인증, API의 MySQL/SQS 연결, SMS 워커 큐 소비,
워커의 뿌리오 계정·등록 발신번호·잔액을 확인한다. 실제 소량 발송 검증은 별도 승인된
수신 대상으로 수행한 뒤 활성화한다. 이번 변경은 실제 발송 검증이나 운영 설정을 수행하지 않았다.
CRM에 뿌리오 키·발신번호·SQS 자격증명을 추가할 필요는 없다. 기존 `PPURIO_*` 구성은 사용하지 않는다.

워크스페이스 설정 권한이 있고, 활성화·주소·인증·워크스페이스 설정이 모두 유효한 경우에만
문자 작성 화면을 노출한다. 문자 탭은 항상 표시하며, 미설정·권한 없음·조회 중·오류·구버전
서버에서는 작성 폼 대신 설정 및 사용 권한 확인 안내만 표시한다. 서버도 미리보기와 발송을 차단한다. 가용성 조회는 외부 health check가 아니라 구성 검사이므로, 운영 준비 확인을
생략하고 활성화하지 않는다. 설정 변경 후 작성 패널을 다시 열어 새 가용성 값을 조회한다.

## 발송 계약

대표 국내 휴대전화만 사용하고 번호 없음·중복을 제외한다. 호출자의 레코드 권한으로
목록과 고객을 조회하며 최대 10,000명이다. 개인화 이름·기업명은 각 100자 이내다.
`{{fullName}}` → `[*이름*]`, `{{companyName}}` → `[*1*]`로 전송한다.
CRM은 개인화 후와 템플릿 길이를 모두 확인하고 SMS/LMS별 최대 **100명**씩 API에 요청한다.
상위 API의 200명 한도보다 작게 유지한다. 제목은 선택이며 최대 15자다.
개인화 값 때문에 LMS가 필요한데 제목이 없으면 `심방콜 문자`를 제목으로 보내 LMS를 보장한다.

본문은 보수적인 UTF-8 90/2,000바이트 기준이다. 상위 API는 CP949/EUC-KR 지원 문자만
허용하며, 미지원 문자 요청은 실패할 수 있다. 광고는 `(광고)`와 080 번호를 요구하고
`rejectType: AD`를 보낸다. `duplicateFlag: N`으로 중복 번호 발송을 금지한다.

## 접수 상태와 재시도

`core.smsDispatch`에 스냅샷과 배치 상태를 저장하고 requestId unique 및 DB advisory lock으로
CRM 내 중복 실행을 방지한다. 작업당 한 배치만 실행하고 나머지는 후속 작업으로 분리한다.
기존 DB `from` 열에는 API 주소 스냅샷을 저장한다. 기존 직접 뿌리오 작업이나 다른 주소로
생성한 작업은 새 API로 돌려 보내지 않고 실패 처리한다.

외부 요청 전에 SENDING을 저장한다. API의 HTTP 성공 및 `statusCode: 200`은 ACCEPTED,
최종 도착 성공은 아니다. 상위 API는 호출자 멱등키를 지원하지 않고 발송 추적 키를 반환하지
않는다. 일부 배치가 이미 접수된 후 502가 발생할 수 있어 타임아웃·5xx·불명확한 응답·중단은
UNKNOWN으로 남기고 자동 재발송하지 않는다. 명시적인 400/401/403/404/422 거절만 FAILED다.
최종 발송 결과 및 불명확한 접수는 가인지 어드민 발송 이력을 확인한다.

CRM 대기열 장애 후에는 동일 requestId로 대기 작업만 다시 등록할 수 있다. Redis 작업이
영구 유실되면 운영자가 DB의 대기 상태를 확인한 뒤 같은 dispatchId 작업을 재등록한다.
즉시 SMS/LMS 범위이며 예약·MMS는 포함하지 않는다.
