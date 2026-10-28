# AX-1327 월간 자금 흐름

대시보드는 `cashFlowSnapshot`의 한국 시간 기준 이번 달 최신 백업을 읽는다. 은행 실시간 연동이 아니며 화면에 백업일과 은행별 최종 거래일을 표시한다. 전사 자금이므로 그룹·구성원 필터를 적용하지 않는다. 누락·권한 오류는 0원 대신 미확인으로 표시한다.

## 승인된 집계 규칙

- 잔액: 신한·국민·농협 입출금 내역의 최종 거래 시각별 잔액을 합산한다. 행 순서에 의존하지 않는다.
- 입금예정액: 발행 기업 입금 리스트 전체(이전 미수금 포함), 노란색 완료 행 제외.
- 분할 입금: 그룹별 마지막 누적 잔금(H열) 한 번만 사용한다. 발행액(E)−입금액(G)과 대조한다. 일반 표와 기업명 별칭·일자·금액이 일치한 항목은 중복 제외한다. 모호한 일치는 자동 추측하지 않고 실패시킨다.
- 지출예정액: 이번 달 지출대기액 H열 현금 지출 계획의 상세 행 합계. 소계·합계 행 제외, J열 지출완료액을 차감하지 않는다.
- 가용액: 잔액 + 입금예정액 − 지출예정액.

## 백업과 로컬 반영

원본 XLSX 전체와 정규화 JSON은 Git에 포함하지 않는 `data/backups/`에 보관한다. 원본을 수정하지 않으며 SHA256·백업 시각·은행별 원본 행·입금 제외 행을 JSON에 남긴다. 2026-10-28 백업은 `data/backups/ax-1327-20261028/`에 저장했다. 실제 금융 금액·기업별 내역은 이 문서나 Git에 복사하지 않는다.

저장소 루트에서:

```sh
python3 packages/twenty-server/scripts/extract-pending-expenses.py SOURCE.xlsx pending-expenses.json
python3 packages/twenty-server/scripts/extract-cash-flow.py SOURCE.xlsx pending-expenses.json YYYY-MM cash-flow.json
node packages/twenty-server/scripts/import-cash-flow-local.cjs cash-flow.json
node packages/twenty-server/scripts/import-cash-flow-local.cjs cash-flow.json --apply
```

Python은 openpyxl이 필요하다. 마지막 단계는 localhost DB만 허용하며 메타데이터와 레코드를 API로 반영한다. 같은 원본 해시·월은 같은 ID를 사용해 재실행 시 중복 생성하지 않는다. 새 백업은 새 해시의 레코드로 보관한다. 금융 원본과 이 객체의 조회 권한은 운영 반영 전에 담당자가 설정해야 한다. 운영 자동 동기화는 포함하지 않는다.

기존 지출대기액 행은 행번호 기반 키를 사용하므로 새 파일을 기존 상세 테이블에 무조건 재수입하지 않았다. 원본 전체 백업과 월간 집계만 추가했다. 은행 거래를 개별 CRM 행으로 복제하거나 Google Sheets를 주기적으로 수집하지 않는다.
