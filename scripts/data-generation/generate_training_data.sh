#!/bin/bash

# Configuration
SERVER_URL="http://tdll-8gpu2:8666"

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
        local lang_dir="data/training/${lang}"
        mkdir -p "$lang_dir"
        
        # Full example (all tokens)
        local output_file_full="${lang_dir}/${lang}-${num}-full.json"
        echo "Creating full training example $lang-$num..."
        process_training_example \
            "$text" \
            "$source" \
            "$output_file_full"
        
        # # Limited example (first 30 tokens for quicker visualization)
        # local output_file_limited="${lang_dir}/${lang}-${num}-limited.json"
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
mkdir -p data/training

# Define all languages
declare -A LANGUAGES=(
    ["en"]="prompts/training/training_en.jsonl"
    ["cs"]="prompts/training/training_cs.jsonl"
    ["fr"]="prompts/training/training_fr.jsonl"
    ["de"]="prompts/training/training_de.jsonl"
    ["es"]="prompts/training/training_es.jsonl"
    ["zh"]="prompts/training/training_zh.jsonl"
    ["ar"]="prompts/training/training_ar.jsonl"
    ["hi"]="prompts/training/training_hi.jsonl"
    ["ja"]="prompts/training/training_ja.jsonl"
)

# Process training examples for each language
for lang in "${!LANGUAGES[@]}"; do
    jsonl_file="${LANGUAGES[$lang]}"
    if [ -f "$jsonl_file" ]; then
        case $lang in
            en) lang_name="English" ;;
            cs) lang_name="Czech" ;;
            fr) lang_name="French" ;;
            de) lang_name="German" ;;
            es) lang_name="Spanish" ;;
            zh) lang_name="Chinese" ;;
            ar) lang_name="Arabic" ;;
            hi) lang_name="Hindi" ;;
            ja) lang_name="Japanese" ;;
            *) lang_name="Unknown" ;;
        esac
        echo ""
        echo "Processing $lang_name training examples..."
        process_language "$lang" "$jsonl_file"
    fi
done

# Create examples.json index file
echo ""
echo "Creating examples index..."
python create_examples_index.py data/training

echo ""
echo "Done! Generated training examples in data/training/"
