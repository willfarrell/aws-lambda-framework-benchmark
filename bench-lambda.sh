#!/usr/bin/env bash
set -euo pipefail

IMAGE="aws-lambda-framework-bench:local"
SCENARIO="${1:-}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

# AWS Lambda core allocation per configured memory.
# https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
#   128  - 1769 MB -> 1 core
#   1770 - 3538 MB -> 2 cores
#   3539 - 5307 MB -> 3 cores
#   5308 - 7076 MB -> 4 cores
#   7077 - 8845 MB -> 5 cores
#   8846 - 10240 MB -> 6 cores
TIERS=(128 256 512 1024)
if [ -n "${MEM:-}" ]; then TIERS=("$MEM"); fi

cores_for_mem() {
  local m=$1
  if   [ "$m" -le 1769 ]; then echo 1
  elif [ "$m" -le 3538 ]; then echo 2
  elif [ "$m" -le 5307 ]; then echo 3
  elif [ "$m" -le 7076 ]; then echo 4
  elif [ "$m" -le 8845 ]; then echo 5
  else echo 6
  fi
}

docker build -t "$IMAGE" "$ROOT"
mkdir -p "$ROOT/results"

# The orchestrator runs on the host (node bench.js); it spawns one container
# PER CANDIDATE so each framework gets the full tier memory/cores on its own —
# mirroring a real Lambda function that loads exactly one wrapper. The host
# never imports a framework, so no `npm install` is required here.
for MEM in "${TIERS[@]}"; do
  CORES=$(cores_for_mem "$MEM")
  CPUSET="0-$((CORES - 1))"
  [ "$CORES" -eq 1 ] && CPUSET="0"
  SUBDIR="lambda-${MEM}MB"
  mkdir -p "$ROOT/results/$SUBDIR"

  echo
  echo "================================================================"
  echo "Lambda tier: ${MEM} MB  /  ${CORES} core(s) (cpuset ${CPUSET})  ->  results/${SUBDIR}/"
  echo "================================================================"

  RESULTS_SUBDIR="$SUBDIR" \
  TIME="${TIME:-1000}" \
  WARMUP="${WARMUP:-100}" \
  ITERATIONS="${ITERATIONS:-10}" \
  BENCH_DOCKER_IMAGE="$IMAGE" \
  BENCH_DOCKER_MEM="$MEM" \
  BENCH_DOCKER_CPUS="$CORES" \
  BENCH_DOCKER_CPUSET="$CPUSET" \
    node "$ROOT/bench.js" $SCENARIO || echo "(tier ${MEM}MB exited non-zero)"
done
