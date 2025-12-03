# LLM Visualization Data Generation

This directory contains scripts for generating visualization data for the animated-llm application. There are two main types of data generation:

1. **Inference Data** - Visualizes how LLMs generate text from prompts
2. **Training Data** - Visualizes how LLMs process text during training

## Prerequisites

1. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Start the appropriate server:
   - For inference: `python llm_inference_server.py`
   - For training: `python llm_training_server.py`

## Inference Data Generation

Generates data showing how different LLMs respond to prompts using various decoding strategies.

### Script: `generate_inference_data.sh`

**Configuration** (edit at the top of the script):

- `OUTPUT_DIR`: Output directory (default: `../../public/data`)
- `SERVER_URL`: URL of the inference server (default: `http://localhost:8712`)
- `MAX_NEW_TOKENS`: Maximum tokens to generate (default: `100`)
- `MODELS`: List of model IDs to generate data for

**Prompt Files** (in `prompts/inference/`):

- `prompts_{lang}.txt` - One file per language (e.g., `prompts_en.txt`, `prompts_cs.txt`)

One prompt per line. Empty lines and lines starting with `#` are skipped.

**Usage:**

```bash
bash generate_inference_data.sh
```

**Output:**
For each prompt, generates three variants with different decoding strategies:

- `{lang}-{num}-greedy-{model}.json` - Greedy decoding (temperature=0)
- `{lang}-{num}-sampling-{model}.json` - Sampling (temperature=1.0)
- `{lang}-{num}-random-{model}.json` - Random sampling (temperature=5)

Files are saved to `../../public/data/inference/{lang}/`

## Training Data Generation

Generates data showing how LLMs process text during training (next-token prediction).

### Script: `generate_training_data.sh`

**Configuration** (edit at the top of the script):

- `OUTPUT_DIR`: Output directory (default: `../../public/data`)
- `SERVER_URL`: URL of the training server (default: `http://localhost:8712`)
- `MODELS`: List of model IDs, including special `:random` variant for vanilla transformers

**Training Files** (in `prompts/training/`):

- `training_{lang}.jsonl` - One file per language (e.g., `training_en.jsonl`, `training_cs.jsonl`)

Each line is a JSON object with:

```json
{ "text": "Text to process", "source": "Source description" }
```

**Usage:**

```bash
bash generate_training_data.sh
```

**Output:**

- `{lang}-{num}-full-{model}.json` - Complete training visualization

Files are saved to `../../public/data/training/{lang}/`

## Client Scripts

### `llm_inference_client.py`

Queries the inference server and formats output for visualization.

**Usage:**

```bash
python llm_inference_client.py "Your prompt here" \
    --server http://localhost:8712 \
    --max-new-tokens 100 \
    --language en \
    --top-k 10 \
    --temperature 1.0 \
    -o output.json
```

### `llm_training_client.py`

Queries the training server and formats output for training visualization.

**Usage:**

```bash
python llm_training_client.py \
    -t "Text to process" \
    --source "Source description" \
    --server http://localhost:8712 \
    --max-tokens 50 \
    -o output.json
```

## Index Generation

After generating data, create/update the `examples.json` index file:

```bash
# For inference data
python create_examples_index.py ../../public/data/inference

# For training data
python create_examples_index.py ../../public/data/training
```

This scans all JSON files and creates an index with metadata about each example.

## Supported Models

The scripts can work with any Hugging Face model compatible with the transformers library. Edit the `MODELS` array in the generation scripts to specify which models to use.

For training visualization, you can also use the special `:random` suffix (e.g., `model-id:random`) to load a vanilla transformer with random weights.

## Example Workflow

```bash
# 1. Start the inference server
python llm_inference_server.py

# 2. Add your prompts to the appropriate language file
echo "Your prompt here" >> prompts/inference/prompts_en.txt

# 3. Generate inference data
bash generate_inference_data.sh

# 4. Start the training server (in a new terminal)
python llm_training_server.py

# 5. Add training examples (one JSON object per line)
echo '{"text": "Your text here", "source": "Source description"}' >> prompts/training/training_en.jsonl

# 6. Generate training data
bash generate_training_data.sh
```
