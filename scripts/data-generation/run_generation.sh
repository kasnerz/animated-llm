#!/bin/bash
#SBATCH -J animllm-gen
#SBATCH -p gpu-ms,gpu-troja
#SBATCH --constraint="gpuram48G"
#SBATCH -G 1
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --time=12:00:00
#
# Runs the full inference + training data generation on one GPU.
# Both generation scripts skip outputs that already exist, so resubmitting this
# job after a failure resumes where it left off.
#
# Usage: sbatch scripts/data-generation/run_generation.sh [inference|training|both]

set -u

# sbatch runs a copy of this script from the Slurm spool directory, so $0 does
# not point at the repository. Prefer the submit directory when running under
# Slurm; override with DATAGEN_DIR if submitting from elsewhere.
DATAGEN_DIR="${DATAGEN_DIR:-${SLURM_SUBMIT_DIR:-$(dirname "$0")}/scripts/data-generation}"
if [ ! -f "$DATAGEN_DIR/llm_inference_server.py" ]; then
    echo "ERROR: could not locate data-generation scripts in $DATAGEN_DIR"
    echo "Set DATAGEN_DIR to the scripts/data-generation directory."
    exit 1
fi
cd "$DATAGEN_DIR" || exit 1
echo "Working directory: $(pwd)"

WHICH="${1:-both}"
PYTHON="${WD_VIRTUALENV_DIR}/vllm/bin/python"
PORT=8712
SERVER_URL="http://localhost:${PORT}"
LOG_DIR="${LOG_DIR:-${SLURM_SUBMIT_DIR:-.}/.generation-logs}"

mkdir -p "$LOG_DIR"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# The generation scripts invoke `python`, so put the venv first on PATH.
export PATH="$(dirname "$PYTHON"):$PATH"

wait_for_server() {
    for _ in $(seq 1 180); do
        if curl -s "${SERVER_URL}/" > /dev/null; then
            return 0
        fi
        sleep 5
    done
    echo "ERROR: server did not come up"
    return 1
}

run_stage() {
    local stage=$1          # inference | training
    local server_script=$2
    local generate_script=$3

    echo ""
    echo "############################################################"
    echo "# Stage: $stage"
    echo "############################################################"

    $PYTHON "$server_script" --port "$PORT" > "$LOG_DIR/${stage}_server.log" 2>&1 &
    local server_pid=$!
    trap 'kill $server_pid 2>/dev/null' EXIT

    if ! wait_for_server; then
        kill $server_pid 2>/dev/null
        return 1
    fi

    bash "$generate_script"
    local status=$?

    kill $server_pid 2>/dev/null
    wait $server_pid 2>/dev/null
    trap - EXIT

    return $status
}

if [ "$WHICH" = "inference" ] || [ "$WHICH" = "both" ]; then
    run_stage inference llm_inference_server.py generate_inference_data.sh \
        || echo "WARNING: inference stage reported a failure"
fi

if [ "$WHICH" = "training" ] || [ "$WHICH" = "both" ]; then
    run_stage training llm_training_server.py generate_training_data.sh \
        || echo "WARNING: training stage reported a failure"
fi

echo ""
echo "=== Generation done ==="
