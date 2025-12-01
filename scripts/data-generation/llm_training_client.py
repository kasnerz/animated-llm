"""
Client script for generating training visualization JSON files.
Queries the training FastAPI server and formats the output for the animated-llm app.
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import requests


class TrainingClient:
    def __init__(self, server_url="http://localhost:8666"):
        self.server_url = server_url.rstrip("/")
        self.session = requests.Session()

    def check_server(self):
        """Check if the server is running."""
        try:
            response = self.session.get(f"{self.server_url}/")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error: Cannot connect to server at {self.server_url}")
            print(
                f"Make sure the server is running with: python llm_training_server.py"
            )
            sys.exit(1)

    def get_model_info(self):
        """Get model information from the server."""
        try:
            response = self.session.get(f"{self.server_url}/model_info")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting model info: {e}")
            sys.exit(1)

    def process_training(self, text, source, max_tokens=None):
        """Process a training example."""
        try:
            response = self.session.post(
                f"{self.server_url}/process_training",
                json={
                    "text": text,
                    "source": source,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error processing training example: {e}")
            if hasattr(e.response, "text"):
                print(f"Server response: {e.response.text}")
            sys.exit(1)

    def create_training_json(
        self,
        text,
        source,
        max_tokens=None,
        example_id=None,
    ):
        """Create a JSON file suitable for training visualization."""

        # Check server
        print("Checking server connection...")
        server_info = self.check_server()
        print(f"Connected to server: {server_info.get('message')}")
        print(f"Model: {server_info.get('model')}")

        # Get model info
        print("\nFetching model information...")
        model_info = self.get_model_info()
        print(f"Model architecture: {model_info.get('architecture')}")
        print(f"Model layers: {model_info.get('num_layers')}")
        print(f"Hidden size: {model_info.get('hidden_size')}")
        print(f"Total parameters: {model_info.get('total_parameters'):,}")

        # Process training example
        print(f"\nProcessing training example...")
        print(f"Text: '{text[:100]}{'...' if len(text) > 100 else ''}'")
        print(f"Source: {source}")
        if max_tokens:
            print(f"Max tokens: {max_tokens}")

        training_data = self.process_training(
            text=text,
            source=source,
            max_tokens=max_tokens,
        )

        # Create the output structure
        if example_id is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            example_id = f"training_{timestamp}"

        output = {
            "id": example_id,
            "type": "training",
            "text": training_data["text"],
            "source": training_data["source"],
            "tokens": training_data["tokens"],
            "token_ids": training_data["token_ids"],
            "num_tokens": training_data["num_tokens"],
            "model_info": model_info,
            "training_steps": training_data["training_steps"],
        }

        return output

    def save_json(self, data, output_path):
        """Save the data to a JSON file."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"\n✓ JSON file saved to: {output_path}")
        print(f"  File size: {output_path.stat().st_size} bytes")
        print(f"  Training steps: {len(data['training_steps'])}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate training visualization JSON files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process a training example from a file
  python llm_training_client.py -f prompts/training/training_examples.txt -s "Wikipedia" -o data/training/example.json
  
  # Process a direct text input
  python llm_training_client.py -t "The quick brown fox jumps" -s "Example" -o data/training/test.json
  
  # Limit to first N tokens
  python llm_training_client.py -f input.txt -s "Source" --max-tokens 50 -o output.json
  
  # Use custom server URL
  python llm_training_client.py -t "Test" -s "Test" --server http://192.168.1.100:8666
        """,
    )

    # Input source (mutually exclusive)
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        "-t",
        "--text",
        type=str,
        help="Direct text input to process",
    )
    input_group.add_argument(
        "-f",
        "--file",
        type=str,
        help="Path to file containing the text to process",
    )

    parser.add_argument(
        "-s",
        "--source",
        type=str,
        required=True,
        help="Source of the text (e.g., URL, book title, etc.)",
    )

    parser.add_argument(
        "--max-tokens",
        type=int,
        default=None,
        help="Maximum number of tokens to process (default: process all)",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        help="Output file path (default: data/training/training_TIMESTAMP.json)",
    )

    parser.add_argument(
        "--example-id",
        type=str,
        default=None,
        help="Custom example ID (default: training_TIMESTAMP)",
    )

    parser.add_argument(
        "--server",
        type=str,
        default="http://localhost:8666",
        help="Server URL (default: http://localhost:8666)",
    )

    args = parser.parse_args()

    # Get text input
    if args.text:
        text = args.text
    else:
        # Read from file
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                text = f.read().strip()
        except FileNotFoundError:
            print(f"Error: File not found: {args.file}")
            sys.exit(1)
        except Exception as e:
            print(f"Error reading file: {e}")
            sys.exit(1)

    # Determine output path
    if args.output is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"data/training/training_{timestamp}.json"
    else:
        output_path = args.output

    # Create client
    client = TrainingClient(server_url=args.server)

    # Generate JSON
    try:
        data = client.create_training_json(
            text=text,
            source=args.source,
            max_tokens=args.max_tokens,
            example_id=args.example_id,
        )

        # Save to file
        client.save_json(data, output_path)

        print(f"\n✓ Success! Training visualization file created.")

    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
