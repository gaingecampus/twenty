#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

read_file() {
  local file_path="$1"
  local section_title="$2"

  if [[ ! -f "$file_path" ]]; then
    return
  fi

  printf '## %s\n\n' "$section_title"
  cat "$file_path"
  printf '\n\n---\n\n'
}

context=""
context+=$(read_file GAINGE_CONTEXT.md GAINGE_CONTEXT.md)
context+=$(read_file GAINGE_RUNBOOK.md GAINGE_RUNBOOK.md)
context+=$(read_file GAINGE_WORKFLOWS.md GAINGE_WORKFLOWS.md)

python3 -c 'import json, sys; print(json.dumps({"additional_context": sys.stdin.read()}))' <<<"$context"
