# AX-1327 월간 자금 흐름

대시보드는 `cashFlowSnapshot`에서 한국 시간 기준 이번 달의 최신 백업 식별자를 찾고, 같은 `sourceHash`의 CRM `bankTransaction`·`expectedReceipt` 상세 레코드를 직접 조회·집계한다. 저장된 스냅샷 합계는 검증용으로 보존한다. 지출대기액은 CRM `pendingExpense`의 이번 달 현재 데이터를 직접 합산한다. 은행 실시간 연동이 아니며 도움말에서 백업일과 은행별 잔액·최종 거래일을 확인한다. 전사 자금이므로 그룹·구성원 필터를 적용하지 않는다. 누락·권한 오류·미완료 상세 백업은 0원 대신 미확인으로 표시한다.

## 승인된 집계 규칙

- 잔액: 같은 백업의 신한·국민·농협 입출금 내역에서 은행별 최종 거래 시각의 잔액을 합산한다. 행 순서에 의존하지 않는다. 클릭하면 해당 백업의 입출금 전체 목록을 거래일순으로 열고, 행 클릭으로 개별 상세를 연다.
- 입금예정액: 발행 기업 입금 리스트 중 `expectedDate`가 한국 시간 기준 오늘 이후인 항목(오늘 포함, 향후 월 포함). 지난 예정일·예정일 미입력·노란색 완료 행 제외. `inclusionStatus = 포함` 행의 `outstandingAmount`를 서버에서 합산한다. 클릭하면 같은 조건의 근거 목록을 열고, 개별 상세를 확인할 수 있다. 별도 메뉴에는 제외된 원본 행도 보존한다.
- 분할 입금: 그룹별 마지막 누적 잔금(H열) 한 번만 사용한다. 발행액(E)−입금액(G)과 대조한다. 일반 표와 기업명 별칭·일자·금액이 일치한 항목은 중복 제외한다. 모호한 일치는 자동 추측하지 않고 실패시킨다.
- 지출대기액: CRM `pendingExpense.expenseMonth`가 이번 달이며 `scheduledDate`가 한국 시간 기준 오늘 이후(오늘 포함)이고 `sourceRecordType`이 비어 있는 상세 행의 `plannedCashAmount` 합계. 서버에서 전체 행을 집계하며 원본 보충 행(제목·소계·메모)은 제외한다. 지난 예정일·예정일 미입력 행도 제외한다. `paidAmount`는 차감하지 않는다. 금액을 클릭하면 동일 조건의 근거 목록을 연다. 조회 실패·통화 이상은 0원으로 치환하지 않는다.
- 가용액: 잔액 + 입금예정액 − CRM 지출대기액. 잔액·입금예정액은 최신 백업에 연결된 상세 DB를 사용하고 새로고침은 백업 식별자와 CRM 집계를 모두 다시 조회한다. 은행·시트 자동 동기화는 포함하지 않는다.

## 백업과 로컬 반영

금액 필드는 원화 전체 숫자(천 단위 쉼표, 소수점 0자리)로 표시한다. 가져오기 시 신규·기존 금액 필드 모두 `format: full`, `decimals: 0`을 적용해 k/m 축약을 사용하지 않는다.

원본 XLSX 전체와 정규화 JSON은 Git에 포함하지 않는 `data/backups/`에 보관한다. 원본을 수정하지 않으며 SHA256·백업 시각·은행별 원본 행·입금 제외 행을 JSON에 남긴다. 2026-10-28 백업은 `data/backups/ax-1327-20261028/`에 저장했다. 실제 금융 금액·기업별 내역은 이 문서나 Git에 복사하지 않는다.

저장소 루트에서:

```sh
python3 packages/twenty-server/scripts/extract-pending-expenses.py SOURCE.xlsx pending-expenses.json
python3 packages/twenty-server/scripts/extract-cash-flow.py SOURCE.xlsx pending-expenses.json YYYY-MM cash-flow.json
node packages/twenty-server/scripts/import-cash-flow-local.cjs cash-flow.json
node packages/twenty-server/scripts/import-cash-flow-local.cjs cash-flow.json --apply
python3 packages/twenty-server/scripts/extract-cash-flow-details.py SOURCE.xlsx YYYY-MM cash-flow-details.json
node packages/twenty-server/scripts/import-cash-flow-details-local.cjs cash-flow-details.json
node packages/twenty-server/scripts/import-cash-flow-details-local.cjs cash-flow-details.json --apply
```

Python은 openpyxl이 필요하다. 마지막 단계는 localhost DB만 허용하며 메타데이터와 레코드를 API로 반영한다. 같은 원본 해시·월은 같은 ID를 사용해 재실행 시 중복 생성하지 않는다. 새 백업은 새 해시의 레코드로 보관한다. 금융 원본과 이 객체의 조회 권한은 운영 반영 전에 담당자가 설정해야 한다. 운영 자동 동기화는 포함하지 않는다.

`bankTransaction`은 은행·거래일시·입금액·출금액·거래 후 잔액·내용을 보존한다. `expectedReceipt`는 기업·예정일·발행금액·분할입금액·누적잔금·합산 대상 미입금액·합산 구분을 보존한다. 양쪽 모두 원본 탭·행·링크·해시·백업시각을 보관하며 텍스트의 계좌·카드 등 긴 식별번호는 끝 4자리만 남긴다. 원본 파일은 변경하지 않는다.

상세 레코드 ID는 원본 해시·탭·행으로 결정한다. 동일 백업 재실행은 누락 행만 생성하고 기존 금액·내용을 덮어쓰지 않는다. 검증 불일치나 이전 삭제가 있으면 중단한다. 모든 저장 행·금액·날짜를 확인한 후에만 스냅샷의 `detailsReady`를 활성화한다. 서로 다른 백업은 구분하여 보존하고 대시보드는 한 백업만 집계하므로 재수입에 따른 중복 합산을 방지한다.

기존 지출대기액 행은 별도 기존 데이터를 유지한다. 새 파일을 기존 지출 상세 테이블에 무조건 재수입하지 않는다. 신규 객체·보기·메뉴 생성은 현재 로컬 전용 스크립트이며 운영 배포나 Google Sheets 주기 수집은 포함하지 않는다.
