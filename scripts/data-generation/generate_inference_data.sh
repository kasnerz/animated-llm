#!/bin/bash

# Configuration
OUTPUT_DIR="../../public/data"
SERVER_URL="http://localhost:8712"
MAX_NEW_TOKENS=100

# Existing output files are skipped, so a rerun resumes an interrupted job and
# leaves already-generated outputs untouched. Set to 0 to regenerate everything.
SKIP_EXISTING=1

# Model IDs from MODEL_REGISTRY
# gpt2-xl is listed so that any language it is missing gets filled in; its
# already-generated outputs are left alone by SKIP_EXISTING.
MODELS=(
    "google/gemma-4-E4B-it"
    "google/gemma-4-E4B"
    "HuggingFaceTB/SmolLM-1.7B-Instruct"
    "Qwen/Qwen3.5-9B"
    "openai-community/gpt2-xl"
)

# Function to load model on server
load_model() {
    local model_id=$1
    
    echo "Loading model: $model_id"
    
    # Call the load_model endpoint
    response=$(curl -s -X POST "${SERVER_URL}/load_model" \
        -H "Content-Type: application/json" \
        -d "{\"model_id\": \"$model_id\"}")
    
    if echo "$response" | grep -q "success"; then
        echo "Model loaded successfully: $model_id"
        return 0
    else
        echo "Error loading model: $response"
        return 1
    fi
}

# Function to get model name from server
get_model_name() {
    MODEL_NAME=$(curl -s "${SERVER_URL}/model_info" | python3 -c "import sys, json; print(json.load(sys.stdin)['name'])" 2>/dev/null)
    
    if [ -z "$MODEL_NAME" ]; then
        echo "Error: Could not fetch model name from server"
        return 1
    fi
    
    # Sanitize model name for use in filenames (replace / with -, remove special chars)
    MODEL_ID=$(echo "$MODEL_NAME" | sed 's/\//-/g' | sed 's/[^a-zA-Z0-9._-]/_/g')
    echo "Current model: $MODEL_NAME (ID: $MODEL_ID)"
    return 0
}

# Function to process prompts for a given language
process_prompts() {
    local lang=$1
    local prompts_file=$2
    
    if [ ! -f "$prompts_file" ]; then
        echo "Warning: Prompts file $prompts_file not found, skipping $lang"
        return
    fi
    
    local counter=1
    while IFS= read -r prompt || [ -n "$prompt" ]; do
        # Skip empty lines and comments
        if [ -z "$prompt" ] || [[ "$prompt" =~ ^#.* ]]; then
            continue
        fi
        
        # Format counter with leading zeros (001, 002, etc.)
        local num=$(printf "%03d" $counter)
        
        # Create language-specific directory
        local lang_dir="${OUTPUT_DIR}/inference/${lang}"
        mkdir -p "$lang_dir"
        
        # Generate three variants: greedy (temp 0), sampling (temp 1), random (temp 5)
        for variant in "greedy:0" "sampling:1.0" "random:5"; do
            local variant_name="${variant%%:*}"
            local temperature="${variant##*:}"
            local output_file="${lang_dir}/${lang}-${num}-${variant_name}-${MODEL_ID}.json"

            if [ "$SKIP_EXISTING" = "1" ] && [ -s "$output_file" ]; then
                echo "Skipping existing $(basename "$output_file")"
                continue
            fi

            echo "Processing $lang prompt $num ($variant_name): $prompt"
            python llm_inference_client.py "$prompt" \
                --server "$SERVER_URL" \
                --max-new-tokens "$MAX_NEW_TOKENS" \
                --language "$lang" \
                --top-k 10 \
                --temperature "$temperature" \
                -o "$output_file"
        done

        counter=$((counter + 1))
    done < "$prompts_file"
}

# Create data directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}/inference"

# Define all languages
declare -A LANGUAGES=(
    ["en"]="prompts/inference/prompts_en.txt"
    ["cs"]="prompts/inference/prompts_cs.txt"
    ["fr"]="prompts/inference/prompts_fr.txt"
    ["zh"]="prompts/inference/prompts_zh.txt"
    ["uk"]="prompts/inference/prompts_uk.txt"
)

# Check if server is running
echo "Checking if server is running at $SERVER_URL..."
if ! curl -s "${SERVER_URL}/" > /dev/null; then
    echo "Error: Server is not running at $SERVER_URL"
    echo "Please start the server first using: python llm_inference_server.py"
    exit 1
fi

# Loop through all models
for model_id in "${MODELS[@]}"; do
    echo ""
    echo "========================================="
    echo "Processing model: $model_id"
    echo "========================================="
    
    # Load the model on the server
    if ! load_model "$model_id"; then
        echo "Skipping model $model_id due to loading error"
        continue
    fi
    
    # Get the sanitized model name
    if ! get_model_name; then
        echo "Skipping model $model_id due to name fetch error"
        continue
    fi
    
    # Process prompts for each language
    for lang in "${!LANGUAGES[@]}"; do
        prompts_file="${LANGUAGES[$lang]}"
        if [ -f "$prompts_file" ]; then
            case $lang in
                en) lang_name="English" ;;
                cs) lang_name="Czech" ;;
                fr) lang_name="French" ;;
                zh) lang_name="Chinese" ;;
                uk) lang_name="Ukrainian" ;;
                *) lang_name="Unknown" ;;
            esac
            echo ""
            echo "Processing $lang_name prompts..."
            process_prompts "$lang" "$prompts_file"
        fi
    done
done

# Create examples.json index file
echo ""
echo "Creating examples index..."
python create_examples_index.py "${OUTPUT_DIR}/inference"

echo ""
echo "Done! Generated inference examples for all models in ${OUTPUT_DIR}/inference/"