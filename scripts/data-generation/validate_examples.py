#!/usr/bin/env python3
"""
Check generated example JSON files the way the frontend reads them.

Mirrors the filtering in src/services/examplesApi.js so that parsing problems
(leaked chat markers, missing space markers, control tokens in the answer text)
show up here instead of in the browser.

Usage:
    python validate_examples.py path/to/file.json [more.json ...]
    python validate_examples.py path/to/data/inference   # walks a directory
"""

import json
import re
import sys
from pathlib import Path

# Patterns mirroring isSpecialToken() in src/utils/tokenProcessing.js
SPECIAL_PATTERNS = [
    re.compile(r"^<[A-Z_]+>$"),
    re.compile(r"^<(bos|eos|pad|unk|mask)>$"),
    re.compile(r"^<\|.*\|>$"),
    re.compile(r"^<\|[a-z_]+>$"),
    re.compile(r"^<[a-z_]+\|>$"),
]
THINK_TAGS = {"<think>", "</think>"}

# Fragments that must never survive filtering. Catches both whole markers and
# the pieces they break into when a tokenizer splits them.
LEAK_MARKERS = [
    "<|im_start|>",
    "<|im_end|>",
    "<|turn>",
    "<turn|>",
    "<|channel>",
    "<channel|>",
    "<|think|>",
    "<think>",
    "</think>",
    "<|eot_id|>",
    "<bos>",
    "<eos>",
]


def looks_special(token):
    if not isinstance(token, str) or not token:
        return False
    if token in THINK_TAGS:
        return True
    return any(p.match(token) for p in SPECIAL_PATTERNS)


def filter_tokens(tokens, special_idx):
    """Frontend-equivalent filtering: special_idx wins, patterns are the fallback."""
    if isinstance(special_idx, list):
        special = set(special_idx)
        return [t for i, t in enumerate(tokens) if i not in special]
    return [t for t in tokens if not looks_special(t)]


def check_inference(data, path, problems):
    steps = data.get("generation_steps") or []
    if not steps:
        problems.append("no generation steps")
        return

    first, last = steps[0], steps[-1]
    if not isinstance(first.get("special_idx"), list):
        # Expected for files generated before the field existed (e.g. reused
        # gpt2-xl outputs); the pattern fallback still has to hold, and the
        # leak checks below verify that it does.
        print("  NOTE         : no special_idx, using pattern fallback")

    visible_prompt = filter_tokens(first.get("tokens") or [], first.get("special_idx"))
    visible_last = filter_tokens(last.get("tokens") or [], last.get("special_idx"))

    for token in visible_last:
        for marker in LEAK_MARKERS:
            if marker in token:
                problems.append(f"special marker {marker!r} survives filtering as {token!r}")

    # The answer the app builds: selected tokens, minus control tokens.
    answer = "".join(
        (s.get("selected_token") or {}).get("token", "")
        for s in steps
        if not (s.get("selected_token") or {}).get("special")
    )
    for marker in LEAK_MARKERS:
        if marker in answer:
            problems.append(f"answer text contains {marker!r}")

    # A prompt containing spaces should carry space markers on some tokens.
    # Scripts written without spaces (Chinese) legitimately have none.
    prompt_text = data.get("prompt") or ""
    if " " in prompt_text and not any("Ġ" in t or "▁" in t for t in visible_prompt):
        problems.append("no space markers (Ġ/▁) in prompt tokens - spaces will not render")

    print(f"  model        : {data.get('model_info', {}).get('name')}")
    print(f"  prompt       : {data.get('prompt')!r}")
    print(f"  steps        : {len(steps)}")
    print(f"  visible input: {visible_prompt}")
    print(f"  answer       : {answer[:220]!r}")


def check_training(data, path, problems):
    tokens = data.get("tokens") or []
    special_idx = data.get("special_idx")
    if not isinstance(special_idx, list):
        print("  NOTE         : no special_idx, using pattern fallback")

    visible = filter_tokens(tokens, special_idx)
    for token in visible:
        for marker in LEAK_MARKERS:
            if marker in token:
                problems.append(f"special marker {marker!r} survives filtering as {token!r}")

    steps = data.get("training_steps") or []
    if not steps:
        problems.append("no training steps")

    info = data.get("model_info", {})
    for field in ("num_layers", "hidden_size", "num_attention_heads", "vocab_size"):
        if info.get(field) is None:
            problems.append(f"model_info.{field} is null")

    print(f"  model        : {info.get('name')}")
    print(f"  architecture : {info.get('architecture')}")
    print(f"  layers/hidden: {info.get('num_layers')} / {info.get('hidden_size')}")
    print(f"  steps        : {len(steps)}")
    print(f"  visible      : {visible[:20]}")


def check_file(path):
    print(f"\n=== {path}")
    problems = []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  UNREADABLE: {e}")
        return 1

    if "generation_steps" in data:
        check_inference(data, path, problems)
    else:
        check_training(data, path, problems)

    for problem in problems:
        print(f"  PROBLEM: {problem}")
    return len(problems)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)

    paths = []
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.is_dir():
            paths.extend(sorted(f for f in p.rglob("*.json") if f.name != "examples.json"))
        else:
            paths.append(p)

    total = sum(check_file(p) for p in paths)
    print(f"\n{len(paths)} file(s) checked, {total} problem(s) found")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
