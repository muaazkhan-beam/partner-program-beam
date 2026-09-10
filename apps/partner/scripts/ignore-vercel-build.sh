#!/usr/bin/env bash
# Vercel ignoreCommand: exit 0 skips the build, exit 1 proceeds.
set -u

paths=(
  .
  ../../pnpm-lock.yaml
  ../../pnpm-workspace.yaml
  ../../package.json
)

if [[ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" && -n "${VERCEL_GIT_COMMIT_SHA:-}" ]]; then
  if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" -- "${paths[@]}"; then
    echo "Skipping Partner Vercel build: no Partner-relevant changes."
    exit 0
  fi
  exit 1
fi

if git diff --quiet HEAD^ HEAD -- "${paths[@]}" 2>/dev/null; then
  echo "Skipping Partner Vercel build: no Partner-relevant changes."
  exit 0
fi

exit 1
