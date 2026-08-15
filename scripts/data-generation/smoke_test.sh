#!/bin/bash
#SBATCH -J animllm-smoke
#SBATCH -p gpu-ms,gpu-troja
#SBATCH --constraint="gpuram48G"
#SBATCH -G 1
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --time=2:00:00
#
# Loads every model through both servers and generates one short example each,
# so model loading and token parsing can be checked before the full run.

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

PYTHON="${WD_VIRTUALENV_DIR}/vllm/bin/python"
OUT_DIR="${1:-/tmp/animllm-smoke}"
WHICH="${2:-both}"   # inference | training | both
PORT=8712
SERVER_URL="http://localhost:${PORT}"

MODELS=(
    "google/gemma-4-E4B-it"
    "google/gemma-4-E4B"
    "HuggingFaceTB/SmolLM-1.7B-Instruct"
    "Qwen/Qwen3.5-9B"
    "openai-community/gpt2-xl"
)

mkdir -p "$OUT_DIR"
echo "Output: $OUT_DIR"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

wait_for_server() {
    for _ in $(seq 1 120); do
        if curl -s "${SERVER_URL}/" > /dev/null; then
            return 0
        fi
        sleep 5
    done
    echo "ERROR: server did not come up"
    return 1
}

# ---------------------------------------------------------------- inference
if [ "$WHICH" = "inference" ] || [ "$WHICH" = "both" ]; then
echo "=== Starting inference server ==="
$PYTHON llm_inference_server.py --port "$PORT" > "$OUT_DIR/inference_server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

wait_for_server || exit 1

for model_id in "${MODELS[@]}"; do
    echo ""
    echo "--- $model_id (inference)"
    response=$(curl -s -X POST "${SERVER_URL}/load_model" \
        -H "Content-Type: application/json" \
        -d "{\"model_id\": \"$model_id\"}")
    if ! echo "$response" | grep -q "success"; then
        echo "LOAD FAILED: $response"
        continue
    fi

    safe_name=$(echo "$model_id" | sed 's/\//-/g')
    $PYTHON llm_inference_client.py "Who are you?" \
        --server "$SERVER_URL" \
        --max-new-tokens 30 \
        --language en \
        --top-k 10 \
        --temperature 0 \
        -o "$OUT_DIR/infer-${safe_name}.json" || echo "GENERATE FAILED: $model_id"
done

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
trap - EXIT
fi

# ----------------------------------------------------------------- training
if [ "$WHICH" = "training" ] || [ "$WHICH" = "both" ]; then
echo ""
echo "=== Starting training server ==="
$PYTHON llm_training_server.py --port "$PORT" > "$OUT_DIR/training_server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

wait_for_server || exit 1

for model_id in "${MODELS[@]}"; do
    echo ""
    echo "--- $model_id (training)"
    response=$(curl -s -X POST "${SERVER_URL}/load_model" \
        -H "Content-Type: application/json" \
        -d "{\"model_id\": \"$model_id\", \"random_weights\": false}")
    if ! echo "$response" | grep -q "success"; then
        echo "LOAD FAILED: $response"
        continue
    fi

    safe_name=$(echo "$model_id" | sed 's/\//-/g')
    $PYTHON llm_training_client.py \
        -t "The capital of the United Kingdom is London." \
        --source "Smoke test" \
        --server "$SERVER_URL" \
        -o "$OUT_DIR/train-${safe_name}.json" || echo "PROCESS FAILED: $model_id"
done

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
trap - EXIT
fi

echo ""
echo "=== Smoke test done ==="
ls -la "$OUT_DIR"
