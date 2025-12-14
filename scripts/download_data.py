import os
import json
import requests
from pathlib import Path
import argparse

BASE_URL = "https://animatedllm.github.io/data"
DATA_DIR = Path(__file__).parent.parent / "public" / "data"

def download_file(url, local_path):
    local_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url} to {local_path}...")
    response = requests.get(url)
    if response.status_code == 200:
        with open(local_path, 'wb') as f:
            f.write(response.content)
        return True
    else:
        print(f"Failed to download {url}: {response.status_code}")
        return False

def download_data(data_type):
    print(f"--- Downloading {data_type} data ---")
    
    # Download index file
    index_url = f"{BASE_URL}/{data_type}/examples.json"
    local_index_path = DATA_DIR / data_type / "examples.json"
    
    if not download_file(index_url, local_index_path):
        return

    # Parse index and download examples
    with open(local_index_path, 'r') as f:
        data = json.load(f)
        
    examples = data.get('examples', [])
    print(f"Found {len(examples)} examples.")
    
    for example in examples:
        file_path = example.get('file')
        if file_path:
            file_url = f"{BASE_URL}/{data_type}/{file_path}"
            local_file_path = DATA_DIR / data_type / file_path
            
            # Skip if already exists? Maybe add a force flag.
            # For now, just download.
            download_file(file_url, local_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download visualization data from the deployed site.")
    parser.add_argument("--types", nargs="+", default=["inference", "training"], help="Data types to download (inference, training)")
    args = parser.parse_args()

    for data_type in args.types:
        download_data(data_type)
        
    print("\nDone! Data downloaded to public/data/")
