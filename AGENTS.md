# GAINGE Twenty — Codex 저장소 지침

이 저장소는 GAINGE 커스텀 포크입니다. 이 지침은 저장소 전체에 적용됩니다.
Cursor의 `.cursor/hooks.json` 실행 여부에 의존하지 않고 아래 규칙을 적용합니다.

## Jira 및 커밋 필수 절차

커밋·PR·Jira 작업 전 `GAINGE_WORKFLOWS.md`를 읽고 따릅니다. 해당 문서가
워크플로의 단일 원본이며, 아래 내용은 누락을 막기 위한 필수 요약입니다.

1. CRM 작업 시작 시 Jira에서 `project = AX AND labels = CRM`과 관련 키워드로
   기존 이슈를 검색합니다. 관련 이슈가 없으면 먼저 생성합니다.
2. 이슈 생성 시 프로젝트 `AX`, 라벨 `CRM`, 제목 접두어 `[CRM]`을 적용합니다.
   이슈 유형별 제목·본문·에픽 연결은 `GAINGE_WORKFLOWS.md`를 따릅니다.
3. 커밋 직전에 각 변경과 연결할 실제 Jira 이슈 키를 확인합니다. 이슈 키를
   추측하거나 임의로 만들지 않습니다. Jira 접근 실패 시 구현·검증은 진행하되,
   이슈 확인을 생략한 커밋은 하지 않고 실패 원인을 알립니다.
4. 커밋 제목은 `AX-XXX 한글 요약`, 본문은 변경 이유 1~2문장으로 작성합니다.
5. 한 커밋에 한 가지 의도만 담고, 테스트와 생성물은 원인 변경에 포함합니다.
   무관한 변경을 섞지 않고 stage된 diff를 확인합니다.
6. 관련 단위 테스트, `npx nx lint:diff-with-main <project>`,
   `npx nx typecheck <project>`를 수행합니다. 실패·미실행은 숨기지 않습니다.
7. 최종 보고에 커밋 해시, 연결한 Jira 이슈, 검증 결과를 남깁니다.
   푸시된 이력을 Jira 연결 목적으로 임의 재작성하지 않습니다.

## 기존 규칙의 진입점

- 포크 정책이 필요하면 `GAINGE_CONTEXT.md`를 읽습니다.
- 실행·배포·환경 작업은 `GAINGE_RUNBOOK.md`를 우선 읽습니다.
- 테마·패딩·폰트·색·radius·`--t-*` 변경 전
  `.cursor/rules/003-fork-enterprise-theme.mdc`를 읽고 적용합니다.
- 코드 변경 전 `.cursor/rules/architecture.mdc`와
  `.cursor/rules/code-style.mdc`를 읽고 적용합니다.
- 이미 읽은 문서는 변경되지 않았다면 반복해서 읽지 않습니다.

이 파일은 Codex의 자동 지침 진입점입니다. 상세 규칙은 위 원본 문서에서
관리하며, 커밋 규칙이 바뀌면 이 파일의 필수 요약도 함께 갱신합니다.
