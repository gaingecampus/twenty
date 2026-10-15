# 지출대기액 로컬 가져오기

`가인지 지출대기액[2026]` 탭을 Excel로 내려받아 아래 순서로 실행합니다.
Python에는 읽기용 `openpyxl`이 필요합니다. 원본 파일과 JSON에는 금융 정보가
포함되므로 저장소 밖에 보관합니다.

```bash
python3 packages/twenty-server/scripts/extract-pending-expenses.py SOURCE.xlsx /tmp/pending-expenses.json
node packages/twenty-server/scripts/import-pending-expenses-local.cjs /tmp/pending-expenses.json
node packages/twenty-server/scripts/import-pending-expenses-local.cjs /tmp/pending-expenses.json --apply
```

- 기존 로컬 연결 도구가 DB 호스트를 localhost/127.0.0.1로 제한합니다.
- 메타데이터와 데이터 생성은 로컬 CRM API를 사용합니다.
- 2026년 월별 제목을 기준으로 날짜의 연·월을 복원합니다. 날짜가 없거나
  불명확하면 추정하지 않고 원문과 확인 사항을 저장합니다.
- 내용이 있는 모든 행을 가져옵니다. 합계·소계·반복 제목·헤더·빈 양식·별도 메모는 원본 보존 행으로 표시합니다. 해당 행의 값과 수식은 원본 추가 메모에 보존하고 통화 필드는 비워 중복 합산을 방지합니다. 완전히 빈 행만 레코드로 만들지 않습니다.
- G/H/J 금액은 원본 수식의 계산 결과를 통화 필드로 보존합니다.
  빈 금액과 0원을 구분합니다. 지급 완료 상태는 추정하지 않습니다.
- 원본의 월별 예정/확정은 지급 상태가 아닌 별도 필드입니다.
- 품목과 매입처가 같은 행도 별도 지출일 수 있으므로 합치지 않습니다.
- 파일 ID·탭 ID·행 번호로 중복 생성을 방지합니다. 동일 스냅샷 재실행용이며,
  시트 행 삽입·이동 이후 자동 재동기화용은 아닙니다. 기존 레코드는 덮어쓰지
  않고 검증 불일치를 보고합니다.
- 등록 후 전체 행의 텍스트·금액·날짜·원본 링크를 대조합니다.
- 원본 합계 수식 중 일부는 상세 행을 제외합니다. 원본 합계를 상세 행 합계로
  간주하지 않으며, 해당 수식은 중간 JSON의 `sourceTotals`와 CRM 원본 보존 행의 추가 메모에 보존합니다.

2026-10-15 스냅샷: 지출 내역 743건 + 원본 보존 행 54건 = 797건. 날짜 확인 사항 18건. 원본 보충 행 보기에서 보존 행만 확인할 수 있습니다. 새 객체의 필드는 추가·편집할
수 있으며, 원본 Google 시트와의 실시간 동기화는 구성하지 않습니다.
