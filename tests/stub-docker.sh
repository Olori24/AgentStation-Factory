#!/usr/bin/env bash
# Test-only stub that emulates the subset of the Docker CLI the sandbox service
# uses, so the app -> sandbox-service -> execution -> response path can be
# exercised end to end in an environment without a container engine.
#
# It is NOT part of the product; it lives under tests/ and is only used by
# tests/verify_compose_profile.sh.
set -u

case "${1:-}" in
  --version)
    echo "Docker version 27.0.0-stub, build stub"
    exit 0
    ;;
  image)
    # `docker image inspect <img>` -> pretend the image is present.
    exit 0
    ;;
  rm)
    exit 0
    ;;
  build)
    echo "[stub docker] build $*"
    exit 0
    ;;
  run)
    shift
    dir=""
    prev=""
    for arg in "$@"; do
      if [ "$prev" = "-v" ]; then
        dir="${arg%%:*}"
      fi
      prev="$arg"
    done
    # The command is the final argument (after `sh -lc`).
    for last; do :; done
    if [ -n "$dir" ] && [ -d "$dir" ]; then
      cd "$dir" || exit 1
    fi
    sh -lc "$last"
    exit $?
    ;;
  *)
    exit 0
    ;;
esac
