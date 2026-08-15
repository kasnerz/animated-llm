"""
Shared helpers for the inference and training visualization servers.

Keeps model loading, config introspection and token display consistent between
`llm_inference_server.py` and `llm_training_server.py`.
"""

import logging
from typing import List, Optional, Set

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

logger = logging.getLogger(__name__)


def load_tokenizer(model_id: str):
    """Load a tokenizer, allowing repositories that ship custom tokenizer code."""
    return AutoTokenizer.from_pretrained(
        model_id,
        use_fast=True,
        trust_remote_code=True,
    )


def load_causal_lm(model_id: str, device: str, dtype=None):
    """
    Load a decoder-only LM for next-token prediction and move it onto `device`.

    Newer multimodal releases (Gemma 4, Qwen3.5) ship a `*ForConditionalGeneration`
    class that is not registered under `AutoModelForCausalLM`, so fall back to the
    image-text-to-text auto class. Both expose `outputs.logits` for a plain
    `input_ids` forward pass, which is all the visualization needs.

    Placement is a plain `.to(device)` rather than `device_map="auto"`: the models
    used here fit on a single GPU, and `device_map` would pull in `accelerate`.
    """
    if dtype is None:
        dtype = "auto" if device == "cuda" else torch.float32

    kwargs = dict(dtype=dtype, trust_remote_code=True)

    auto_classes = [AutoModelForCausalLM]
    try:
        from transformers import AutoModelForImageTextToText

        auto_classes.append(AutoModelForImageTextToText)
    except ImportError:
        pass

    errors = []
    for auto_class in auto_classes:
        try:
            model = auto_class.from_pretrained(model_id, **kwargs)
            logger.info(f"Loaded {model_id} via {auto_class.__name__}")
            return model.to(device)
        except (ValueError, KeyError) as e:
            # Raised when the architecture is not registered for this auto class.
            logger.info(f"{auto_class.__name__} could not load {model_id}: {e}")
            errors.append(f"{auto_class.__name__}: {e}")

    # Report the first failure: later auto classes fail with a misleading
    # "unrecognized configuration class" that hides the real cause.
    raise RuntimeError(f"Could not load {model_id} as a causal LM: {errors[0]}")


def get_text_config(config):
    """
    Return the sub-config holding the text-decoder hyperparameters.

    Multimodal configs (Gemma 4, Qwen3.5) nest them under `text_config`; plain
    decoder-only configs expose them at the top level.
    """
    return getattr(config, "text_config", None) or config


def describe_config(config) -> dict:
    """Extract the decoder hyperparameters the visualization displays."""
    text_config = get_text_config(config)

    def pick(*names):
        for name in names:
            value = getattr(text_config, name, None)
            if value is not None:
                return value
        return None

    return {
        "num_layers": pick("num_hidden_layers", "n_layer"),
        "hidden_size": pick("hidden_size", "n_embd"),
        "num_attention_heads": pick("num_attention_heads", "n_head"),
        "vocab_size": pick("vocab_size"),
        "max_position_embeddings": pick("max_position_embeddings", "n_positions"),
        "intermediate_size": pick("intermediate_size", "n_inner"),
    }


def get_special_token_ids(tokenizer) -> Set[int]:
    """
    Collect every token id that is chat/control scaffolding rather than content.

    Uses the tokenizer's own inventory instead of pattern-matching the decoded
    string, so model-specific markers are recognized without hardcoding: Gemma 4
    (`<|turn>`, `<turn|>`, `<|think|>`), ChatML (`<|im_start|>`), Qwen thinking
    tags (`<think>`, `</think>`), and so on.
    """
    special_ids: Set[int] = set()

    try:
        special_ids.update(int(i) for i in (tokenizer.all_special_ids or []))
    except Exception as e:
        logger.warning(f"Could not read all_special_ids: {e}")

    try:
        # Added tokens cover markers that are not flagged `special` in the
        # tokenizer config, e.g. Qwen's <think> / </think>.
        special_ids.update(int(i) for i in tokenizer.get_added_vocab().values())
    except Exception as e:
        logger.warning(f"Could not read added vocab: {e}")

    return special_ids


def get_display_tokens(tokenizer, token_ids: List[int]) -> List[str]:
    """
    Decode token ids for display, normalizing the leading-space marker to 'Ġ'.

    BPE tokenizers (GPT-2, Qwen, SmolLM) mark a leading space with 'Ġ' while
    SentencePiece-style ones (Gemma) use '▁'. Both are normalized to 'Ġ' so the
    frontend sees a single convention.
    """
    tokens = []
    for token_id in token_ids:
        decoded_token = tokenizer.decode([token_id])
        raw_token = tokenizer.convert_ids_to_tokens([token_id])[0]

        if raw_token.startswith("Ġ") or raw_token.startswith("▁"):
            # Take the decoded token (correct unicode) and re-attach the marker.
            if decoded_token.startswith(" "):
                tokens.append("Ġ" + decoded_token[1:])
            else:
                tokens.append(raw_token)
        else:
            tokens.append(decoded_token)
    return tokens


def special_indices(token_ids: List[int], special_ids: Set[int], scaffold: Optional[Set[int]] = None) -> List[int]:
    """
    Return the positions in `token_ids` that the frontend should treat as special.

    A position is special if its token id is a control token, or if it sits in
    `scaffold` — the chat-template regions (role headers) whose tokens are plain
    vocabulary items, e.g. SmolLM tokenizing "assistant" as 'ass' + 'istant'.
    """
    scaffold = scaffold or set()
    return [
        idx
        for idx, token_id in enumerate(token_ids)
        if token_id in special_ids or idx in scaffold
    ]
