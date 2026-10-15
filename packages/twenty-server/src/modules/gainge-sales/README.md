# 가캠 사업부별 매출 (AX-1283)

CRM 대시보드의 `월 누적 매출 · 사업부별` 영역은 가캠 MCP의
`get_sales_by_department` 결과만 표시한다. CRM 입금과 합산하지 않는다.
상단 CRM 그룹/구성원 필터는 적용하지 않으며 전사 매출임을 화면에 표시한다.

## 서버 설정

Admin Panel → Config Variables 또는 서버 환경변수에 아래 네 값을 등록한다.
프론트 환경변수에 토큰을 넣지 않는다. 이 모듈은 토큰을 발급하지 않는다.

| 변수 | 값 |
| --- | --- |
| `GAINGE_SALES_MCP_URL` | 가캠 HTTPS 주소 + `/api/mcp` |
| `GAINGE_SALES_MCP_TOKEN` | 서버용 `sales:read` 토큰 (민감 설정으로 마스킹) |
| `GAINGE_SALES_WORKSPACE_ID` | 매출을 조회할 CRM workspace UUID |
| `GAINGE_SALES_MEMBER_IDS` | 조회 허용 workspaceMember UUID를 쉼표로 구분 |

허용 멤버는 CRM의 teamMember/고객 ID가 아니라 로그인 사용자 workspaceMember ID다.
비어 있으면 연결 대기로 표시한다. 다른 워크스페이스, 허용되지 않은 멤버와
멤버가 없는 API key 요청에는 금액을 반환하지 않는다. 허용 범위와 토큰은
매 요청마다 확인하며 설정 변경 시 캐시를 비운다.

환경변수 변경은 서버 재시작이 필요하다. 실제 운영 설정/배포는 별도다.

## 집계 기준 확인 (2026-10-15)

참조:
- https://github.com/gaingecampus/Moon-Gainge-Back/blob/dev/docs/mcp.md
- 위 저장소 `src/modules/apis/mcp/tools/sales/get-sales-by-department.tool.ts`
- `src/modules/features/payment/sales-query.util.ts`
- Superset 대시보드 41의 차트 272와 데이터셋
  `[지표] 이번 달 전체 매출 v1.0 01/16/2025 16:36:19` SQL

조회 월 1일부터 말일까지, 현재 월은 한국 시간 오늘까지(양 끝 날짜 포함)를
명시해서 조회한다. `get_monthly_sales_report`는 어제까지/월초 지난달 반환
규칙이 있어 월 선택 화면에서는 사용하지 않는다.

공급가액은 결제 건별 `ROUND((결제액 - 환불액) / 1.1, 0)` 집계다.
가캠은 완료 PG·인앱·정기결제를 대상으로 임직원/테스트 계정, 0 이하 금액,
링크코치 주문을 제외한다. 세금계산서 전환 거래를 CRM에서 재합산하지 않는다.
사업부는 가캠의 반환 라벨과 순서를 그대로 사용하고 0원 사업부도 유지한다.

Superset 요청 당시 제목 `[매출] 전체 누적 매출(이번달)-온오프`는 현재
대시보드에서 확인되지 않았다. 사용자가 사업부별 표시로 변경을 요청했다.
원본 SQL의 집계 조건을 대조했으나 실제 토큰이 없으므로 수치 일치는 미검증이다.
헤이든 첨부 프롬프트의 별도 제외 기준도 아직 확인하지 못했다.

## 동작과 검증

- Metadata GraphQL `gaingeMonthlySales(month: "YYYY-MM")`
- 상태: READY / NOT_CONFIGURED / FORBIDDEN / AUTH_ERROR / UNAVAILABLE
- 연결·조회 실패 시 0원으로 대체하지 않음
- VAT 제외/조회 기간/사업부 합계/중복 라벨/안전한 정수 금액 검증
- 성공 응답만 프로세스 내부 60초 캐시, 동시 동일 월 요청 공유, 최대 24개월
- 요청 전체 15초 제한, 최대 응답 1MB, HTTPS만 허용, 리다이렉트 금지
- 원격 오류 본문·토큰·개인정보를 API 응답이나 로그로 전파하지 않음

토큰 수령 후 허용 멤버를 지정하고 로컬 서버에서 현재 월/과거 월을 조회한다.
Superset의 동일 기간 사업부별 합계와 원 단위로 비교한다. 현재 월은
조회 시각에 따라 차이가 날 수 있으므로 같은 기준 시점으로 대조한다.
토큰 만료/권한 회수/서비스 장애도 확인한 뒤 운영에 적용한다.
