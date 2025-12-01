#!/usr/bin/env python3
"""
Create an examples.json index file from all generated JSON files in the data directory.
"""

import json
import sys
from pathlib import Path


def count_tokens(data):
    """Count the total number of tokens generated."""
    try:
        # For inference data
        if "generation_steps" in data:
            return len(data.get("generation_steps", []))
        # For training data
        elif "training_steps" in data:
            return len(data.get("training_steps", []))
        elif "num_tokens" in data:
            return data.get("num_tokens", 0)
        return 0
    except:
        return 0


def extract_language_from_filename(filename):
    """Extract language code from filename (e.g., 'en-001.json' -> 'en')."""
    stem = filename.stem  # Get filename without extension
    if "-" in stem:
        return stem.split("-")[0]
    return "en"  # Default to English


def extract_id_from_filename(filename):
    """Extract ID from filename (e.g., 'en-001-greedy.json' -> 'en-001-greedy' or 'cs-002-sampling.json' -> 'cs-002-sampling')."""
    stem = filename.stem
    # Return the full stem (language-number-variant) as the ID
    return stem


def create_description(data, language):
    """Create a description for the example."""
    # For inference data, use prompt
    if "prompt" in data:
        return f"{data['prompt']}"
    # For training data, use text excerpt
    elif "text" in data:
        text = data["text"]
        # Truncate long text
        max_len = 100
        if len(text) > max_len:
            return f"{text[:max_len]}..."
        return text
    return "Unknown"


def process_data_directory(data_dir):
    """Process all JSON files in the data directory and create examples index."""
    data_path = Path(data_dir)

    if not data_path.exists():
        print(f"Error: Data directory '{data_dir}' does not exist")
        sys.exit(1)

    examples = []

    # Find all JSON files recursively except examples.json itself
    json_files = sorted(
        [f for f in data_path.rglob("*.json") if f.name != "examples.json"]
    )

    if not json_files:
        print(f"Warning: No JSON files found in '{data_dir}'")

    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Extract information from the JSON file
            file_id = extract_id_from_filename(json_file)

            # Determine data type (inference or training)
            data_type = data.get("type", "inference")

            # For inference data
            if "prompt" in data:
                prompt = data.get("prompt", "")
                language = data.get(
                    "language", extract_language_from_filename(json_file)
                )
                temperature = data.get("temperature", 1.0)
                top_k = data.get("top_k", 10)
            # For training data
            else:
                prompt = data.get("text", "")[:100] + (
                    "..." if len(data.get("text", "")) > 100 else ""
                )
                language = extract_language_from_filename(json_file)
                temperature = None
                top_k = None

            num_tokens = count_tokens(data)
            model_id = data.get("model_info", {}).get("name", "unknown")

            # Get relative path from data directory
            relative_path = json_file.relative_to(data_path)

            example = {
                "id": file_id,
                "type": data_type,
                "prompt": prompt,
                "language": language,
                "description": create_description(data, language),
                "num_tokens": num_tokens,
                "model_id": model_id,
                "file": str(relative_path),
            }

            # Add temperature and top_k only for inference
            if temperature is not None:
                example["temperature"] = temperature
            if top_k is not None:
                example["top_k"] = top_k

            # Add source for training data
            if "source" in data:
                example["source"] = data["source"]

            examples.append(example)
            print(
                f"Added: {relative_path} - {prompt[:50]}{'...' if len(prompt) > 50 else ''}"
            )

        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse {json_file.name}: {e}")
        except Exception as e:
            print(f"Warning: Error processing {json_file.name}: {e}")

    return examples


def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"

    print(f"Processing JSON files in '{data_dir}'...")
    examples = process_data_directory(data_dir)

    # Check if examples.json already exists
    output_path = Path(data_dir) / "examples.json"
    existing_examples = []

    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                existing_examples = existing_data.get("examples", [])
            print(
                f"Found existing examples.json with {len(existing_examples)} examples"
            )
        except Exception as e:
            print(f"Warning: Could not read existing examples.json: {e}")

    # Create a set of existing file paths to avoid duplicates
    existing_files = {ex.get("file") for ex in existing_examples if "file" in ex}

    # Filter out examples that already exist (by file path)
    new_examples = [ex for ex in examples if ex.get("file") not in existing_files]

    # Combine existing and new examples
    all_examples = existing_examples + new_examples

    # Create the output structure
    output = {"examples": all_examples}

    # Write to examples.json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(
        f"\nUpdated {output_path} with {len(new_examples)} new examples (total: {len(all_examples)} examples)"
    )


if __name__ == "__main__":
    main()
