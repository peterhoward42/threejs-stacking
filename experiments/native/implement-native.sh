#!/usr/bin/env bash
# Run native curriculum steps through the Cursor Agent CLI.
# Each step starts a fresh agent session (no --continue / --resume).
#
# Usage:
#   ./implement-native.sh              # next unimplemented step (1–25)
#   ./implement-native.sh 4            # step 4 only
#   ./implement-native.sh 4 6          # steps 4, 5, and 6 (one session each)
#   ./implement-native.sh --all          # every remaining step through 25
#   ./implement-native.sh login        # authenticate the CLI
#   ./implement-native.sh --dry-run --all
#
# Environment:
#   AGENT_BIN        path to cursor-agent / agent (auto-detected if unset)
#   CURSOR_MODEL     passed as --model when set
#   CURSOR_API_KEY   alternative to login for headless runs

set -euo pipefail

# Cursor CLI installs cursor-agent and agent under ~/.local/bin; shells often omit it.
export PATH="$HOME/.local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STEPS_DIR="$SCRIPT_DIR/src/steps"
PLANNING_DOC="docs/planning/native.md"
MAX_STEP=25

DRY_RUN=0
RUN_ALL=0
AGENT=""

usage() {
  cat <<'EOF'
implement-native.sh — implement native curriculum steps via Cursor Agent CLI

Each invocation of this script starts a new agent session per step.

Usage:
  ./implement-native.sh login
  ./implement-native.sh [options] [STEP]
  ./implement-native.sh [options] FROM TO

Commands:
  login                Run Cursor Agent login (cursor-agent login)

Options:
  --all, --remaining   Run every step from the next unimplemented through 25
  --dry-run            Print the agent command and prompt; do not run
  -h, --help           Show this help

With no STEP arguments, runs the next step after the highest file in src/steps/.
With one STEP, runs that step only. With FROM TO, runs the inclusive range.

Examples:
  ./implement-native.sh login
  ./implement-native.sh
  ./implement-native.sh --all
  ./implement-native.sh 3
  ./implement-native.sh 4 7
  ./implement-native.sh --dry-run --all
  CURSOR_MODEL=sonnet-4 ./implement-native.sh 5

Requires: Cursor Agent CLI (cursor-agent or agent). Run ./implement-native.sh login
once, or set CURSOR_API_KEY. Add ~/.local/bin to PATH if you want the commands directly.
EOF
}

die() {
  echo "implement-native.sh: $*" >&2
  exit 1
}

resolve_agent() {
  local candidate

  if [[ -n "${AGENT_BIN:-}" ]]; then
    AGENT="$AGENT_BIN"
    return
  fi

  # Prefer cursor-agent: same binary as agent, fewer name clashes on PATH.
  for candidate in cursor-agent agent; do
    if command -v "$candidate" >/dev/null 2>&1; then
      AGENT="$(command -v "$candidate")"
      return
    fi
  done

  for candidate in "$HOME/.local/bin/cursor-agent" "$HOME/.local/bin/agent"; do
    if [[ -x "$candidate" ]]; then
      AGENT="$candidate"
      return
    fi
  done

  die "cursor-agent not found; install: curl https://cursor.com/install -fsS | bash"
}

auth_hint() {
  cat >&2 <<EOF
implement-native.sh: Cursor Agent is not authenticated for headless runs.

  ./implement-native.sh login

Or: cursor-agent login   (after adding ~/.local/bin to PATH)
Or set CURSOR_API_KEY (from cursor.com/settings).

CLI binary: $AGENT
EOF
}

headless_authenticated() {
  if [[ -n "${CURSOR_API_KEY:-}" ]]; then
    return 0
  fi

  local about_json
  about_json="$("$AGENT" about --format json 2>/dev/null)" || return 1
  grep -qE '"userEmail"[[:space:]]*:[[:space:]]*"[^"]+"' <<<"$about_json"
}

require_agent() {
  resolve_agent

  if ! headless_authenticated; then
    auth_hint
    exit 1
  fi
}

run_login() {
  resolve_agent
  echo "Running: $AGENT login"
  exec "$AGENT" login
}

highest_implemented_step() {
  local max=0
  local base num

  shopt -s nullglob
  for path in "$STEPS_DIR"/*.js; do
    base="$(basename "$path")"
    if [[ "$base" =~ ^([0-9]+)- ]]; then
      num=$((10#${BASH_REMATCH[1]}))
      if (( num > max )); then
        max=$num
      fi
    fi
  done
  shopt -u nullglob

  echo "$max"
}

next_step() {
  local highest
  highest="$(highest_implemented_step)"
  echo $((highest + 1))
}

remaining_steps() {
  local from n
  from="$(next_step)"
  (( from <= MAX_STEP )) || die "all $MAX_STEP steps already have files in src/steps/"

  STEPS=()
  for ((n = from; n <= MAX_STEP; n++)); do
    STEPS+=("$n")
  done
}

prompt_for_step() {
  local step=$1
  printf 'Read %s then implement native:%s only.' "$PLANNING_DOC" "$step"
}

run_step() {
  local step=$1
  local prompt
  prompt="$(prompt_for_step "$step")"

  echo ""
  echo "=== native step $step (new session) ==="
  echo "Prompt: $prompt"
  echo ""

  if (( DRY_RUN )); then
    resolve_agent
    echo "[dry-run] cd $REPO_ROOT"
    echo -n "[dry-run] $AGENT -p --trust --force --approve-mcps --workspace $REPO_ROOT"
    [[ -n "${CURSOR_MODEL:-}" ]] && echo -n " --model $CURSOR_MODEL"
    echo " \"$prompt\""
    return 0
  fi

  local -a cmd=(
    "$AGENT"
    -p
    --trust
    --force
    --approve-mcps
    --workspace "$REPO_ROOT"
  )

  if [[ -n "${CURSOR_MODEL:-}" ]]; then
    cmd+=(--model "$CURSOR_MODEL")
  fi

  cmd+=("$prompt")

  if ! (cd "$REPO_ROOT" && "${cmd[@]}"); then
    if ! headless_authenticated; then
      auth_hint
    fi
    return 1
  fi
}

parse_args() {
  local args=()

  while (($# > 0)); do
    case "$1" in
      --all|--remaining)
        RUN_ALL=1
        shift
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      --)
        shift
        args+=("$@")
        break
        ;;
      -*)
        die "unknown option: $1"
        ;;
      *)
        args+=("$1")
        shift
        ;;
    esac
  done

  if (( RUN_ALL )); then
    ((${#args[@]} == 0)) || die "--all cannot be combined with step numbers"
    remaining_steps
    return
  fi

  if ((${#args[@]} == 0)); then
    local n
    n="$(next_step)"
    (( n <= MAX_STEP )) || die "all $MAX_STEP steps already have files in src/steps/"
    STEPS=("$n")
    return
  fi

  if ((${#args[@]} == 1)); then
    STEPS=("${args[0]}")
    return
  fi

  if ((${#args[@]} == 2)); then
    STEPS=()
    local from=${args[0]} to=${args[1]} n
    for ((n = from; n <= to; n++)); do
      STEPS+=("$n")
    done
    return
  fi

  die "too many arguments; use: [STEP] or FROM TO"
}

validate_steps() {
  local step
  for step in "${STEPS[@]}"; do
    [[ "$step" =~ ^[0-9]+$ ]] || die "step must be a positive integer, got: $step"
    (( step >= 1 && step <= MAX_STEP )) || die "step $step out of range (1–$MAX_STEP)"
  done
}

main() {
  if [[ "${1:-}" == "login" ]]; then
    run_login
  fi

  local STEPS=()

  parse_args "$@"
  validate_steps

  if (( DRY_RUN )); then
    resolve_agent
  else
    require_agent
  fi

  [[ -f "$REPO_ROOT/$PLANNING_DOC" ]] || die "missing $PLANNING_DOC (expected repo root: $REPO_ROOT)"

  local step
  for step in "${STEPS[@]}"; do
    run_step "$step"
  done

  echo ""
  echo "Done. Implemented step(s): ${STEPS[*]}"
}

main "$@"
