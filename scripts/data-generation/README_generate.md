# Generate Data Script

This script generates LLM visualization data for multiple prompts in different languages.

## Configuration

Edit the following variables at the top of `generate_data.sh`:

- `SERVER_URL`: The URL of the LLM server (default: `http://tdll-4gpu1:8000`)
- `MAX_NEW_TOKENS`: Maximum number of tokens to generate (default: `100`)

## Usage

1. Create prompt files:
   - `prompts_en.txt` - One English prompt per line
   - `prompts_cs.txt` - One Czech prompt per line

2. Run the script:

   ```bash
   bash generate_data.sh
   ```

3. Output files will be generated in the `data/` directory with the format:
   - `en-001.json`, `en-002.json`, ... for English prompts
   - `cs-001.json`, `cs-002.json`, ... for Czech prompts
   - `examples.json` - An index file listing all generated examples

## Prompt File Format

- One prompt per line
- Empty lines are skipped
- Lines starting with `#` are treated as comments and skipped

## Example

```bash
# Edit configuration if needed
vim generate_data.sh

# Add your prompts
echo "Tell me a joke" >> prompts_en.txt
echo "Řekni mi vtip" >> prompts_cs.txt

# Run the script
bash generate_data.sh
```

## Creating examples.json Manually

You can also create or update the `examples.json` index file separately:

```bash
python create_examples_index.py data
```

This will scan all JSON files in the `data/` directory and create an `examples.json` file with metadata about each example.
