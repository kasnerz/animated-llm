#!/usr/bin/env python3
"""
Mock Data Generator for Animated LLM Demo
Generates realistic-looking pre-computed examples for development.
"""

import json
import math
import os
import random


def tokenize_mock(text):
    """Simple mock tokenization"""
    # Split on spaces and punctuation
    import re

    tokens = re.findall(r"\w+|[^\w\s]", text)
    # Add spaces before most tokens (except first)
    result = [tokens[0] if tokens else ""]
    for token in tokens[1:]:
        if token not in ",.!?;:":
            result.append(" " + token)
        else:
            result.append(token)
    return result


def get_mock_token_ids(tokens):
    """Generate mock token IDs"""
    return [random.randint(100, 100000) for _ in tokens]


def generate_mock_embeddings(tokens):
    """Generate mock embedding values as random floats in [-1, 1] (4 dims), rounded to 1 decimal.

    Each token receives its own vector of independently sampled values to ensure
    vectors differ across tokens.
    """
    def rnd():
        v = round(random.uniform(-1, 1), 1)
        return 0.0 if v == 0.0 else v

    embeddings = []
    for token in tokens:
        values = [rnd() for _ in range(4)]
        embeddings.append({"token": token, "values": values})
    return embeddings


def generate_mock_activations():
    """Generate mock transformer activation (hidden state) values.

    Values are random floats in [-1, 1], rounded to 1 decimal to match requirements.
    """
    # 4 sample values for coloring
    def rnd():
        v = round(random.uniform(-1, 1), 1)
        return 0.0 if v == 0.0 else v

    return {
        "num_layers_shown": 1,
        "sample_activations": [
            {
                "layer": 0,
                "token_position": random.randint(0, 10),
                "values": [rnd() for _ in range(4)],
            }
        ],
    }


def generate_mock_distribution(language, step, prompt_context=""):
    """Generate mock probability distribution with top-10 tokens"""
    # Context-aware token suggestions based on step and prompt
    token_sets = {
        "scrambled_eggs": [
            [
                " To",
                " You",
                " For",
                " The",
                " Sc",
                " Here",
                " All",
                " Eggs",
                "\n",
                " Basic",
            ],
            [
                " make",
                " prepare",
                " cook",
                " create",
                " get",
                " whip",
                " start",
                " begin",
                " have",
                " scramble",
            ],
            [
                " scrambled",
                " perfect",
                " delicious",
                " fluffy",
                " good",
                " basic",
                " simple",
                " easy",
                " great",
                " classic",
            ],
            [
                " eggs",
                " egg",
                " breakfast",
                " dishes",
                " food",
                " meals",
                " recipe",
                " morning",
                " brunch",
                " omelette",
            ],
        ],
        "password": [
            [
                " To",
                " You",
                " First",
                " Click",
                " Go",
                " Navigate",
                " Visit",
                " Open",
                " Try",
                " Check",
            ],
            [
                " reset",
                " change",
                " recover",
                " update",
                " modify",
                " set",
                " create",
                " enter",
                " type",
                " use",
            ],
            [
                " your",
                " the",
                " a",
                " my",
                " this",
                " that",
                " new",
                " old",
                " current",
                " existing",
            ],
            [
                " password",
                " account",
                " login",
                " credentials",
                " email",
                " username",
                " settings",
                " profile",
                " security",
                " link",
            ],
        ],
        "capital": [
            [
                " The",
                " Paris",
                " France",
                " It",
                " Its",
                " That",
                " This",
                " Well",
                " Ah",
                " So",
            ],
            [
                " capital",
                " city",
                " main",
                " largest",
                " biggest",
                " major",
                " central",
                " primary",
                " key",
                " important",
            ],
            [
                " of",
                " in",
                " for",
                " is",
                " city",
                " area",
                " region",
                " country",
                " nation",
                " place",
            ],
        ],
        "default": [
            [
                " To",
                " The",
                " In",
                " This",
                " That",
                " Well",
                " So",
                " Yes",
                " Sure",
                " Here",
            ],
            [
                " is",
                " are",
                " can",
                " will",
                " would",
                " should",
                " could",
                " may",
                " might",
                " does",
            ],
            [
                " a",
                " an",
                " the",
                " this",
                " that",
                " some",
                " many",
                " few",
                " several",
                " various",
            ],
            [
                " answer",
                " response",
                " result",
                " solution",
                " explanation",
                " way",
                " method",
                " approach",
                " idea",
                " thing",
            ],
        ],
    }

    # Determine token set based on prompt context
    if "scrambled" in prompt_context.lower() or "eggs" in prompt_context.lower():
        tokens = token_sets["scrambled_eggs"][
            min(step, len(token_sets["scrambled_eggs"]) - 1)
        ]
    elif "password" in prompt_context.lower() or "reset" in prompt_context.lower():
        tokens = token_sets["password"][min(step, len(token_sets["password"]) - 1)]
    elif "capital" in prompt_context.lower() or "france" in prompt_context.lower():
        tokens = token_sets["capital"][min(step, len(token_sets["capital"]) - 1)]
    else:
        tokens = token_sets["default"][min(step, len(token_sets["default"]) - 1)]

    candidates = []
    remaining_prob = 1.0

    for i, token in enumerate(tokens[:10]):
        if i == 0:
            prob = 0.6 + random.random() * 0.2
        else:
            prob = remaining_prob * (0.3 + random.random() * 0.4)

        remaining_prob -= prob
        logprob = math.log(max(prob, 1e-10))

        candidates.append(
            {
                "token": token,
                "token_id": random.randint(1, 128000),
                "logprob": round(logprob, 4),
                "prob": round(prob, 4),
            }
        )

    # Sort by probability
    candidates.sort(key=lambda x: x["prob"], reverse=True)

    return {"top_k": 10, "candidates": candidates}


def generate_mock_example(
    prompt: str, language: str, num_steps: int = 3, example_id: str = "example_001"
):
    """
    Generate a mock example with realistic-looking data.

    Args:
        prompt: Initial text prompt (ChatGPT-style instruction)
        language: 'en' or 'cs'
        num_steps: Number of generation steps
        example_id: Unique identifier
    """

    # Mock tokenization
    tokens = tokenize_mock(prompt)
    token_ids = get_mock_token_ids(tokens)

    steps = []
    current_text = prompt
    current_tokens = tokens.copy()
    current_token_ids = token_ids.copy()

    for step in range(num_steps):
        step_data = {
            "step": step,
            "input_text": current_text,
            "tokens": current_tokens.copy(),
            "token_ids": current_token_ids.copy(),
            # embeddings & transformer_processing intentionally omitted; generated at runtime in UI
            "output_distribution": generate_mock_distribution(language, step, prompt),
            "selected_token": {},  # Set from distribution
        }

        # Select token (highest prob)
        selected = step_data["output_distribution"]["candidates"][0]
        step_data["selected_token"] = {
            "token": selected["token"],
            "token_id": selected["token_id"],
            "selection_method": "greedy",
        }

        # Update text for next step
        current_text += selected["token"]
        current_tokens.append(selected["token"])
        current_token_ids.append(selected["token_id"])

        steps.append(step_data)

    return {
        "id": example_id,
        "prompt": prompt,
        "language": language,
        "model_info": {
            "name": "meta-llama/Llama-3-8B",
            "num_layers": 4,
            "hidden_size": 4096,
            "num_attention_heads": 32,
            "vocab_size": 128256,
        },
        "generation_steps": steps,
    }


def main():
    """Generate all mock examples"""

    # Ensure output directory exists
    os.makedirs("public/data", exist_ok=True)

    # Define examples - ChatGPT-style instruction prompts
    examples = [
        ("Which ingredients do I need to make scrambled eggs?", "en", 3, "example_001"),
        ("How do I reset my password?", "en", 3, "example_002"),
        ("What is the capital of France?", "en", 2, "example_003"),
        ("Explain photosynthesis in simple terms.", "en", 4, "example_004"),
        ("Write a haiku about coding.", "en", 5, "example_005"),
        ("What are the benefits of exercise?", "en", 3, "example_006"),
        ("How do I bake chocolate chip cookies?", "en", 4, "example_007"),
        ("What is machine learning?", "en", 3, "example_008"),
        ("Give me a fun fact about dolphins.", "en", 3, "example_009"),
        ("How do I start learning Python?", "en", 4, "example_010"),
    ]

    print(f"Generating {len(examples)} mock examples...")

    for i, (prompt, lang, steps, example_id) in enumerate(examples, 1):
        print(f"  [{i}/{len(examples)}] {example_id}: {prompt[:50]}...")
        data = generate_mock_example(prompt, lang, steps, example_id)
        with open(f"public/data/{example_id}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # Generate examples index
    examples_index = {
        "examples": [
            {
                "id": example_id,
                "prompt": prompt,
                "language": lang,
                "description": f"ChatGPT-style prompt: {prompt[:50]}{'...' if len(prompt) > 50 else ''}",
                "num_tokens": steps,
                "file": f"{example_id}.json",
            }
            for prompt, lang, steps, example_id in examples
        ]
    }

    with open("public/data/examples.json", "w", encoding="utf-8") as f:
        json.dump(examples_index, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Generated {len(examples)} examples")
    print(f"✓ Created examples.json index")
    print(f"\nFiles created in public/data/:")
    print(f"  - examples.json")
    for _, _, _, example_id in examples:
        print(f"  - {example_id}.json")


if __name__ == "__main__":
    main()
