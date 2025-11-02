#!/bin/bash
# Quick start script for generating LLM visualization data

echo "=== LLM Data Generation Quick Start ==="
echo ""

# Check if server is running
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "⚠️  Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  python scripts/llm_server.py"
    echo ""
    exit 1
fi

echo "✓ Server is running"
echo ""

# Get prompt from user
if [ -z "$1" ]; then
    echo "Usage: $0 <prompt> [max_new_tokens]"
    echo ""
    echo "Examples:"
    echo "  $0 \"What is the capital of France?\""
    echo "  $0 \"Explain quantum computing\" 20"
    echo ""
    exit 1
fi

PROMPT="$1"
MAX_TOKENS="${2:-10}"

echo "Generating with:"
echo "  Prompt: $PROMPT"
echo "  Max tokens: $MAX_TOKENS"
echo ""

# Run client
python scripts/llm_client.py "$PROMPT" --max-new-tokens "$MAX_TOKENS"
