#!/bin/bash

# Configuration
OUTPUT_DIR="../../public/data"
SERVER_URL="http://localhost:8712"

# Model IDs from MODEL_REGISTRY
# Prepend Vanilla Transformer option
MODELS=(
    "meta-llama/Llama-3.2-1B-Instruct:random"  # Vanilla Transformer with random weights
    "CohereForAI/aya-expanse-8b"
    "meta-llama/Llama-3.2-1B-Instruct"
    "Qwen/Qwen3-4B-Instruct-2507"
    "allenai/Olmo-3-7B-Think"
    "openai-community/gpt2-xl"
)

# Function to load model on server
load_model() {
    local model_spec=$1
    local model_id="${model_spec%%:*}"
    local random_weights="false"
    
    # Check if this is the random weights variant
    if [[ "$model_spec" == *":random" ]]; then
        random_weights="true"
        echo "Loading Vanilla Transformer (random weights) based on: $model_id"
    else
        echo "Loading model: $model_id"
    fi
    
    # Call the load_model endpoint
    response=$(curl -s -X POST "${SERVER_URL}/load_model" \
        -H "Content-Type: application/json" \
        -d "{\"model_id\": \"$model_id\", \"random_weights\": $random_weights}")
    
    if echo "$response" | grep -q "success"; then
        echo "Model loaded successfully"
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

# Function to process a training example
process_training_example() {
    local text=$1
    local source=$2
    local output_file=$3
    local max_tokens=$4
    
    echo "Processing training example from: $source"
    
    if [ -n "$max_tokens" ]; then
        python llm_training_client.py \
            -t "$text" \
            --source "$source" \
            --max-tokens "$max_tokens" \
            --server "$SERVER_URL" \
            -o "$output_file"
    else
        python llm_training_client.py \
            -t "$text" \
            --source "$source" \
            --server "$SERVER_URL" \
            -o "$output_file"
    fi
}

# Function to process training examples for a given language
process_language() {
    local lang=$1
    local jsonl_file=$2
    
    if [ ! -f "$jsonl_file" ]; then
        echo "Warning: Training file $jsonl_file not found, skipping $lang"
        return
    fi
    
    local counter=1
    while IFS= read -r json_line || [ -n "$json_line" ]; do
        # Skip empty lines and comments
        if [ -z "$json_line" ] || [[ "$json_line" =~ ^#.* ]]; then
            continue
        fi
        
        # Parse JSON to extract text and source
        local text=$(echo "$json_line" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('text', ''))")
        local source=$(echo "$json_line" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('source', ''))")
        
        # Skip if text is empty
        if [ -z "$text" ]; then
            continue
        fi
        
        # Format counter with leading zeros (001, 002, etc.)
        local num=$(printf "%03d" $counter)
        
        # Create language-specific directory
        local lang_dir="${OUTPUT_DIR}/training/${lang}"
        mkdir -p "$lang_dir"
        
        # Full example (all tokens)
        local output_file_full="${lang_dir}/${lang}-${num}-full-${MODEL_ID}.json"
        echo "Creating full training example $lang-$num..."
        process_training_example \
            "$text" \
            "$source" \
            "$output_file_full"
        
        # # Limited example (first 30 tokens for quicker visualization)
        # local output_file_limited="${lang_dir}/${lang}-${num}-limited-${MODEL_ID}.json"
        # echo "Creating limited training example $lang-$num (30 tokens)..."
        # process_training_example \
        #     "$text" \
        #     "$source" \
        #     "$output_file_limited" \
        #     30
        
        counter=$((counter + 1))
    done < "$jsonl_file"
}

# Create data directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}/training"

# Define all languages
declare -A LANGUAGES=(
    # ["en"]="prompts/training/training_en.jsonl"
    # ["cs"]="prompts/training/training_cs.jsonl"
    # ["fr"]="prompts/training/training_fr.jsonl"
    ["uk"]="prompts/training/training_uk.jsonl"
    # ["zh"]="prompts/training/training_zh.jsonl"
)

# Check if server is running
echo "Checking if server is running at $SERVER_URL..."
if ! curl -s "${SERVER_URL}/" > /dev/null; then
    echo "Error: Server is not running at $SERVER_URL"
    echo "Please start the server first using: python llm_training_server.py"
    exit 1
fi

# Loop through all models
for model_spec in "${MODELS[@]}"; do
    echo ""
    echo "========================================="
    echo "Processing model: $model_spec"
    echo "========================================="
    
    # Load the model on the server
    if ! load_model "$model_spec"; then
        echo "Skipping model $model_spec due to loading error"
        continue
    fi
    
    # Get the sanitized model name
    if ! get_model_name; then
        echo "Skipping model $model_spec due to name fetch error"
        continue
    fi
    
    # Process training examples for each language
    for lang in "${!LANGUAGES[@]}"; do
        jsonl_file="${LANGUAGES[$lang]}"
        if [ -f "$jsonl_file" ]; then
            case $lang in
                en) lang_name="English" ;;
                cs) lang_name="Czech" ;;
                fr) lang_name="French" ;;
                uk) lang_name="Ukrainian" ;;
                zh) lang_name="Chinese" ;;
                *) lang_name="Unknown" ;;
            esac
            echo ""
            echo "Processing $lang_name training examples..."
            process_language "$lang" "$jsonl_file"
        fi
    done
done

# Create examples.json index file
echo ""
echo "Creating examples index..."
python create_examples_index.py "${OUTPUT_DIR}/training"

echo ""
echo "Done! Generated training examples for all models in ${OUTPUT_DIR}/training/"
