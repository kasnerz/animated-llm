# LLM Data Generation Scripts

This directory contains scripts for generating visualization JSON files from real-world LLM data using FastAPI and HuggingFace Transformers.

## Overview

The setup consists of two scripts:

- **`llm_server.py`**: FastAPI server that loads an LLM and provides endpoints for tokenization and generation
- **`llm_client.py`**: Client script that queries the server and generates JSON files for the animated-llm app

## Prerequisites

Install the required dependencies:

```bash
pip install fastapi uvicorn transformers torch accelerate
```

For CUDA support (recommended for faster inference):

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

## Usage

### 1. Start the Server

Edit the `MODEL_ID` variable in `llm_server.py` to specify your desired model:

```python
MODEL_ID = "meta-llama/Llama-3.2-1B-Instruct"  # Change this to your model
```

Then start the server:

```bash
python scripts/llm_server.py
```

The server will:

- Load the specified model and tokenizer
- Start listening on `http://localhost:8000`
- Automatically use GPU if available, otherwise CPU

### 2. Generate JSON Files

Run the client script with your prompt:

```bash
python scripts/llm_client.py "What is the capital of France?"
```

#### Command-line Options

```
positional arguments:
  prompt                The prompt to send to the model

optional arguments:
  -h, --help            Show help message
  -m, --max-new-tokens MAX_NEW_TOKENS
                        Maximum number of new tokens to generate (default: 10)
  -k, --top-k TOP_K     Number of top-k candidates to return (default: 10)
  -l, --language LANGUAGE
                        Language code for the prompt (default: en)
  -o, --output OUTPUT   Output file path (default: public/data/generated_TIMESTAMP.json)
  --example-id ID       Custom example ID (default: generated_TIMESTAMP)
  --server SERVER       Server URL (default: http://localhost:8000)
```

#### Examples

Generate with more tokens:

```bash
python scripts/llm_client.py "Explain quantum computing" --max-new-tokens 20
```

Save to a specific file:

```bash
python scripts/llm_client.py "Hello world" -o public/data/example_custom.json
```

Use a custom server URL:

```bash
python scripts/llm_client.py "Test prompt" --server http://192.168.1.100:8000
```

Generate with custom example ID:

```bash
python scripts/llm_client.py "What is AI?" --example-id "example_011"
```

## Server API Endpoints

The server provides the following endpoints:

### `GET /`

Returns API information and available endpoints.

### `GET /model_info`

Returns model configuration:

```json
{
  "name": "meta-llama/Llama-3.2-1B-Instruct",
  "num_layers": 16,
  "hidden_size": 2048,
  "num_attention_heads": 32,
  "vocab_size": 128256
}
```

### `POST /tokenize`

Tokenizes the input prompt.

Request:

```json
{
  "prompt": "Hello world",
  "apply_chat_template": true
}
```

### `POST /token_ids`

Returns tokens and their IDs.

Request:

```json
{
  "prompt": "Hello world",
  "apply_chat_template": true
}
```

### `POST /generate`

Generates tokens with probability distributions.

Request:

```json
{
  "prompt": "What is the capital of France?",
  "max_new_tokens": 10,
  "top_k": 10,
  "apply_chat_template": true
}
```

Response includes full generation steps with token probabilities.

## How It Works

1. **Server Initialization**: The server loads the specified model and tokenizer on startup
2. **Chat Template**: For instruction-tuned models, the client applies the chat template using `apply_chat_template()`
3. **Token Generation**: The server generates tokens one at a time (greedy decoding)
4. **Probability Distribution**: At each step, the server computes the top-k token candidates with their probabilities
5. **JSON Output**: The client formats the data into the structure expected by the animated-llm visualization

## Output Format

The generated JSON files follow this structure:

```json
{
  "id": "generated_20250102_143022",
  "prompt": "What is the capital of France?",
  "language": "en",
  "model_info": {
    "name": "meta-llama/Llama-3.2-1B-Instruct",
    "num_layers": 16,
    "hidden_size": 2048,
    "num_attention_heads": 32,
    "vocab_size": 128256
  },
  "generation_steps": [
    {
      "step": 0,
      "input_text": "<|begin_of_text|>...",
      "tokens": ["<|begin_of_text|>", "What", " is", ...],
      "token_ids": [128000, 3923, 374, ...],
      "output_distribution": {
        "top_k": 10,
        "candidates": [
          {
            "token": " The",
            "token_id": 578,
            "logprob": -0.4961,
            "prob": 0.6089
          },
          ...
        ]
      },
      "selected_token": {
        "token": " The",
        "token_id": 578,
        "selection_method": "greedy"
      }
    },
    ...
  ]
}
```

## Tips

- **Model Selection**: Use smaller models (1B-3B parameters) for faster generation on CPU
- **Max Tokens**: Keep `max_new_tokens` low (10-20) for quicker generation and clearer visualization
- **Top-K**: Adjust `top_k` to show more or fewer candidate tokens in the visualization
- **GPU Memory**: Large models may require significant GPU memory. Use smaller models or quantization if needed

## Troubleshooting

**Server won't start:**

- Check that all dependencies are installed
- Verify you have enough RAM/VRAM for the model
- Try a smaller model if you encounter OOM errors

**Connection refused:**

- Ensure the server is running before running the client
- Check that the port 8000 is not in use by another application

**Slow generation:**

- Use a GPU for faster inference
- Try a smaller model
- Reduce `max_new_tokens`

**Model not found:**

- Verify you have access to the model on HuggingFace
- Some models require authentication: `huggingface-cli login`
