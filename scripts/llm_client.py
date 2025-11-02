"""
Client script for generating visualization JSON files from LLM data.
Queries the FastAPI server and formats the output for the animated-llm app.
"""

import argparse
import json
import requests
import sys
from pathlib import Path
from datetime import datetime


class LLMClient:
    def __init__(self, server_url="http://localhost:8000"):
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
            print(f"Make sure the server is running with: python scripts/llm_server.py")
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
    
    def generate(self, prompt, max_new_tokens=10, top_k=10, apply_chat_template=True):
        """Generate tokens with probability distributions."""
        try:
            response = self.session.post(
                f"{self.server_url}/generate",
                json={
                    "prompt": prompt,
                    "max_new_tokens": max_new_tokens,
                    "top_k": top_k,
                    "apply_chat_template": apply_chat_template
                }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error generating: {e}")
            if hasattr(e.response, 'text'):
                print(f"Server response: {e.response.text}")
            sys.exit(1)
    
    def create_visualization_json(self, prompt, max_new_tokens=10, top_k=10, 
                                  language="en", example_id=None):
        """Create a JSON file suitable for the animated-llm visualization."""
        
        # Check server
        print("Checking server connection...")
        server_info = self.check_server()
        print(f"Connected to server: {server_info.get('message')}")
        print(f"Model: {server_info.get('model')}")
        
        # Get model info
        print("\nFetching model information...")
        model_info = self.get_model_info()
        print(f"Model layers: {model_info.get('num_layers')}")
        print(f"Hidden size: {model_info.get('hidden_size')}")
        
        # Generate
        print(f"\nGenerating with prompt: '{prompt}'")
        print(f"Max new tokens: {max_new_tokens}, Top-k: {top_k}")
        generation_data = self.generate(
            prompt=prompt,
            max_new_tokens=max_new_tokens,
            top_k=top_k,
            apply_chat_template=True
        )
        
        # Create the output structure
        if example_id is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            example_id = f"generated_{timestamp}"
        
        output = {
            "id": example_id,
            "prompt": prompt,
            "language": language,
            "model_info": model_info,
            "generation_steps": generation_data["generation_steps"]
        }
        
        return output
    
    def save_json(self, data, output_path):
        """Save the data to a JSON file."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ JSON file saved to: {output_path}")
        print(f"  File size: {output_path.stat().st_size} bytes")
        print(f"  Generation steps: {len(data['generation_steps'])}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate visualization JSON files from LLM data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate with default settings
  python scripts/llm_client.py "What is the capital of France?"
  
  # Generate with more tokens
  python scripts/llm_client.py "Explain quantum computing" --max-new-tokens 20
  
  # Save to specific location
  python scripts/llm_client.py "Hello world" -o public/data/example_new.json
  
  # Use custom server URL
  python scripts/llm_client.py "Test" --server http://192.168.1.100:8000
        """
    )
    
    parser.add_argument(
        "prompt",
        type=str,
        help="The prompt to send to the model"
    )
    
    parser.add_argument(
        "-m", "--max-new-tokens",
        type=int,
        default=10,
        help="Maximum number of new tokens to generate (default: 10)"
    )
    
    parser.add_argument(
        "-k", "--top-k",
        type=int,
        default=10,
        help="Number of top-k candidates to return (default: 10)"
    )
    
    parser.add_argument(
        "-l", "--language",
        type=str,
        default="en",
        help="Language code for the prompt (default: en)"
    )
    
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Output file path (default: public/data/generated_TIMESTAMP.json)"
    )
    
    parser.add_argument(
        "--example-id",
        type=str,
        default=None,
        help="Custom example ID (default: generated_TIMESTAMP)"
    )
    
    parser.add_argument(
        "--server",
        type=str,
        default="http://localhost:8000",
        help="Server URL (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    # Determine output path
    if args.output is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"public/data/generated_{timestamp}.json"
    else:
        output_path = args.output
    
    # Create client
    client = LLMClient(server_url=args.server)
    
    # Generate JSON
    try:
        data = client.create_visualization_json(
            prompt=args.prompt,
            max_new_tokens=args.max_new_tokens,
            top_k=args.top_k,
            language=args.language,
            example_id=args.example_id
        )
        
        # Save to file
        client.save_json(data, output_path)
        
        print(f"\n✓ Success! You can now use this file in the animated-llm app.")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
