#!/usr/bin/env bash
set -euo pipefail

python3 -c 'import json; print(json.dumps({"additional_context": """이 저장소는 GAINGE Twenty 포크다 (upstream 아님).
이미 주입된 문서·규칙을 Read로 다시 열지 마라.

- 실행/배포/환경 → 필요할 때만 GAINGE_RUNBOOK.md
- 커밋/PR/Jira → 필요할 때만 GAINGE_WORKFLOWS.md
- 포크 정책 → 필요할 때만 GAINGE_CONTEXT.md
- 테마 패딩/폰트/색/radius/`--t-*` → 003-fork-enterprise-theme.mdc (규칙으로 이미 적용). CSS 두 파일만. 브라우저·Grep 금지.
"""}))'
