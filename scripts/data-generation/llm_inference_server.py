"""
FastAPI server for generating LLM visualization data.
Provides endpoints for tokenization, token IDs, and token probability distributions.
"""

import argparse
import logging
from typing import Dict, List

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from model_utils import (
    describe_config,
    get_display_tokens,
    get_special_token_ids,
    load_causal_lm,
    load_tokenizer,
    special_indices,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Visualization API")

# Global variables for model and tokenizer
tokenizer = None
model = None
special_token_ids = set()

# Global configuration
config_args = None


class TokenizeRequest(BaseModel):
    prompt: str
    apply_chat_template: bool = True


class TokenIdsRequest(BaseModel):
    prompt: str
    apply_chat_template: bool = True


class GenerateRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 10
    top_k: int = 10
    temperature: float = 1.0
    apply_chat_template: bool = True


class LoadModelRequest(BaseModel):
    model_id: str


class TokenCandidate(BaseModel):
    token: str
    token_id: int
    logprob: float
    prob: float


class GenerationStep(BaseModel):
    step: int
    input_text: str
    tokens: List[str]
    token_ids: List[int]
    output_distribution: Dict
    selected_token: Dict


def has_chat_template(tokenizer) -> bool:
    """
    Check if the tokenizer has a chat template available.
    """
    return hasattr(tokenizer, "chat_template") and tokenizer.chat_template is not None


def load_model_and_tokenizer(model_id: str):
    """Load `model_id` into the module globals, replacing anything already loaded."""
    global tokenizer, model, special_token_ids

    logger.info(f"Loading model: {model_id}")
    logger.info(f"Device: {config_args.device}")

    # Clear previous model from memory
    if model is not None:
        del model
        model = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    tokenizer = load_tokenizer(model_id)
    model = load_causal_lm(model_id, config_args.device)
    model.eval()
    special_token_ids = get_special_token_ids(tokenizer)
    config_args.model = model_id

    logger.info("Model loaded successfully")
    logger.info(f"Model dtype: {model.dtype}")
    logger.info(f"Special/control token ids: {len(special_token_ids)}")

    if has_chat_template(tokenizer):
        logger.info("Chat template is available")
    else:
        logger.info("No chat template available - will use direct text generation")


@app.on_event("startup")
async def startup_load_model():
    """Optionally preload a model on startup; otherwise wait for /load_model."""
    if not config_args.preload:
        logger.info("Starting without a model - POST /load_model to load one")
        return

    load_model_and_tokenizer(config_args.model)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LLM Visualization API",
        "model": config_args.model,
        "device": config_args.device,
        "endpoints": {
            "tokenize": "/tokenize",
            "token_ids": "/token_ids",
            "generate": "/generate",
        },
    }


@app.get("/model_info")
async def get_model_info():
    """Get model information."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    description = describe_config(model.config)
    return {
        "name": config_args.model,
        "num_layers": description["num_layers"],
        "hidden_size": description["hidden_size"],
        "num_attention_heads": description["num_attention_heads"],
        "vocab_size": description["vocab_size"],
    }


@app.post("/load_model")
async def load_model_endpoint(request: LoadModelRequest):
    """Load a new model dynamically."""
    logger.info(f"Loading new model: {request.model_id}")

    try:
        load_model_and_tokenizer(request.model_id)

        return {
            "status": "success",
            "model": request.model_id,
            "message": f"Model {request.model_id} loaded successfully",
        }

    except Exception as e:
        logger.error(f"Error loading model {request.model_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@app.post("/tokenize")
async def tokenize(request: TokenizeRequest):
    """Tokenize the input prompt."""
    if tokenizer is None:
        raise HTTPException(status_code=503, detail="Tokenizer not loaded")

    try:
        text = request.prompt

        if request.apply_chat_template and has_chat_template(tokenizer):
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )

        # Tokenize and get IDs
        encoding = tokenizer(text, return_tensors="pt")
        token_ids = encoding.input_ids[0].tolist()
        tokens = get_display_tokens(tokenizer, token_ids)

        return {
            "prompt": request.prompt,
            "formatted_text": text,
            "tokens": tokens,
            "num_tokens": len(tokens),
        }

    except Exception as e:
        logger.error(f"Error in tokenize: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token_ids")
async def get_token_ids(request: TokenIdsRequest):
    """Get token IDs for the input prompt."""
    if tokenizer is None:
        raise HTTPException(status_code=503, detail="Tokenizer not loaded")

    try:
        text = request.prompt

        if request.apply_chat_template and has_chat_template(tokenizer):
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )

        # Tokenize and get IDs
        encoding = tokenizer(text, return_tensors="pt")
        token_ids = encoding.input_ids[0].tolist()
        tokens = get_display_tokens(tokenizer, token_ids)

        return {
            "prompt": request.prompt,
            "formatted_text": text,
            "tokens": tokens,
            "token_ids": token_ids,
            "num_tokens": len(token_ids),
        }

    except Exception as e:
        logger.error(f"Error in token_ids: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
async def generate(request: GenerateRequest):
    """Generate tokens with probability distributions."""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        text = request.prompt
        prompt_token_count = 0
        chat_template_applied = False
        user_message_start_idx = 0  # Index where user message starts in token list
        assistant_header_start_idx = -1  # Index where assistant header starts
        user_content_start_idx = 0  # Index where the user's own text starts

        if request.apply_chat_template and has_chat_template(tokenizer):
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            # Get the number of tokens in the original prompt (for display purposes)
            prompt_only_ids = tokenizer(request.prompt, return_tensors="pt").input_ids
            prompt_token_count = prompt_only_ids.shape[1]
            chat_template_applied = True

            # Find where the USER HEADER starts (to exclude only system, but keep user header markers)
            # We'll tokenize with add_generation_prompt=False to get everything up to (but not including) assistant header.
            text_without_assistant = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=False
            )

            # Calculate assistant header start index
            ids_without_assistant = tokenizer(
                text_without_assistant, return_tensors="pt", add_special_tokens=False
            ).input_ids
            assistant_header_start_idx = ids_without_assistant.shape[1]

            # Try to locate the user header start. Prefer explicit markers; fall back to content position.
            header_start_pos = -1
            # Common patterns for chat templates
            possible_headers = [
                "<|start_header_id|>user<|end_header_id|>",  # Llama 3.x style
                "<|im_start|>user",  # ChatML style (Qwen, SmolLM, Olmo)
                "<|turn>user",  # Gemma 4 style
            ]
            for pat in possible_headers:
                idx = text_without_assistant.find(pat)
                if idx != -1:
                    header_start_pos = idx
                    break
            if header_start_pos == -1:
                # Fallback: place start at the beginning of the user content so we at least include content
                header_start_pos = text_without_assistant.find(request.prompt)
            if header_start_pos > 0:
                prefix_text = text_without_assistant[:header_start_pos]
                prefix_ids = tokenizer(
                    prefix_text, return_tensors="pt", add_special_tokens=False
                ).input_ids
                user_message_start_idx = prefix_ids.shape[1]

            # Locate where the user's own text begins, so the role header in
            # between can be marked as scaffolding. This matters for tokenizers
            # that split the role name into several ordinary tokens (SmolLM
            # encodes "assistant" as 'ass' + 'istant'), which no string pattern
            # on the decoded token would catch.
            content_pos = text_without_assistant.find(request.prompt)
            if content_pos > 0:
                content_prefix_ids = tokenizer(
                    text_without_assistant[:content_pos],
                    return_tensors="pt",
                    add_special_tokens=False,
                ).input_ids
                user_content_start_idx = content_prefix_ids.shape[1]

        # Encode input
        # If chat template was applied, it already includes special tokens, so don't add them again
        input_ids = tokenizer(
            text,
            return_tensors="pt",
            add_special_tokens=not chat_template_applied,
        ).input_ids.to(config_args.device)

        # Gemma 4 ends a turn with <turn|> rather than <eos>, and declares both in
        # its generation config, so collect every id that terminates generation.
        eos_token_ids = set()
        for candidate in (
            tokenizer.eos_token_id,
            getattr(model.generation_config, "eos_token_id", None),
        ):
            if candidate is None:
                continue
            if isinstance(candidate, (list, tuple, set)):
                eos_token_ids.update(int(c) for c in candidate)
            else:
                eos_token_ids.add(int(candidate))

        generation_steps = []
        current_ids = input_ids.clone()

        # Track generated tokens separately from the formatted prompt
        generated_tokens = []
        generated_token_ids = []

        # Positions of the prompt that are chat-template scaffolding rather than
        # user content: the role header before the user's text, and everything
        # from the assistant header onwards.
        prompt_scaffold = set()
        if chat_template_applied:
            prompt_scaffold.update(range(0, user_content_start_idx))
            if assistant_header_start_idx != -1:
                prompt_scaffold.update(
                    range(assistant_header_start_idx, input_ids.shape[1])
                )

        with torch.no_grad():
            for step in range(request.max_new_tokens):
                # Get model outputs
                outputs = model(current_ids)
                logits = outputs.logits[:, -1, :]  # Get logits for the last token

                # 1) Compute the model probability distribution WITHOUT any temperature.
                #    This is what we will save into the JSON and it must be independent of temperature.
                base_probs = torch.softmax(logits, dim=-1)
                base_log_probs = torch.log_softmax(logits, dim=-1)

                # 2) Find top-k tokens based on the base (model) probabilities
                k = min(request.top_k, base_probs.shape[-1])
                top_k_probs, top_k_indices = torch.topk(base_probs[0], k=k)
                top_k_log_probs = base_log_probs[0][top_k_indices]

                # Convert to lists for display
                top_k_tokens = get_display_tokens(tokenizer, top_k_indices.tolist())
                top_k_token_ids = top_k_indices.tolist()
                top_k_probs_list = top_k_probs.tolist()
                top_k_log_probs_list = top_k_log_probs.tolist()

                # 3) Select the next token by sampling FROM the top-k, using temperature only for the sampling
                if request.temperature is None or request.temperature <= 0:
                    # Greedy: always select the top token
                    selected_token_id = top_k_indices[0].item()
                    selection_method = "greedy"
                else:
                    # Apply temperature to the top-k logits and sample
                    top_k_logits = logits[0, top_k_indices]
                    sampling_logits = top_k_logits / request.temperature
                    sampling_probs = torch.softmax(sampling_logits, dim=-1)
                    sampled_idx = torch.multinomial(
                        sampling_probs, num_samples=1
                    ).item()
                    selected_token_id = top_k_indices[sampled_idx].item()
                    selection_method = "sampling"

                selected_token = get_display_tokens(tokenizer, [selected_token_id])[0]

                # For display: show only the prompt + tokens generated so far (exclude current selection)
                if chat_template_applied:
                    # Use the formatted text (with chat template applied) for tokenization
                    # This ensures we include all special tokens like <|im_start|>, <|im_end|>, etc.
                    prompt_token_ids = input_ids[0].tolist()

                    # Exclude system message tokens - only include from user message onwards
                    prompt_token_ids_no_system = prompt_token_ids[
                        user_message_start_idx:
                    ]

                    # Determine end of user input (start of assistant header)
                    end_idx = len(prompt_token_ids)
                    if (
                        assistant_header_start_idx != -1
                        and assistant_header_start_idx > user_message_start_idx
                    ):
                        end_idx = assistant_header_start_idx

                    user_input_token_ids = prompt_token_ids[
                        user_message_start_idx:end_idx
                    ]

                    prompt_tokens = get_display_tokens(
                        tokenizer, prompt_token_ids_no_system
                    )

                    # Include all tokens (including special tokens) but without system message
                    display_tokens = prompt_tokens + generated_tokens
                    display_token_ids = prompt_token_ids_no_system + generated_token_ids

                    # Decode all tokens including special tokens, excluding system message
                    # Use user_input_token_ids for text to hide assistant header/think tokens from input text
                    display_text = tokenizer.decode(
                        user_input_token_ids + generated_token_ids,
                        skip_special_tokens=False,
                    )

                    # Re-base the scaffold positions onto the displayed slice
                    display_scaffold = {
                        i - user_message_start_idx
                        for i in prompt_scaffold
                        if i >= user_message_start_idx
                    }
                else:
                    # Without chat template, show the input up to now (exclude current selection)
                    display_token_ids = current_ids[0].tolist()
                    display_tokens = get_display_tokens(tokenizer, display_token_ids)
                    display_text = tokenizer.decode(
                        current_ids[0], skip_special_tokens=False
                    )
                    display_scaffold = set()

                # Positions the frontend should hide unless "show special tokens"
                # is on: control tokens plus chat-template scaffolding.
                display_special_idx = special_indices(
                    display_token_ids, special_token_ids, display_scaffold
                )

                # Build candidates list (from base model probabilities; independent of temperature)
                candidates = [
                    {
                        "token": token,
                        "token_id": token_id,
                        "logprob": round(log_prob, 4),
                        "prob": round(prob, 4),
                    }
                    for token, token_id, log_prob, prob in zip(
                        top_k_tokens,
                        top_k_token_ids,
                        top_k_log_probs_list,
                        top_k_probs_list,
                    )
                ]

                # Create generation step
                step_data = {
                    "step": step,
                    "input_text": display_text,
                    "tokens": display_tokens,
                    "token_ids": display_token_ids,
                    "special_idx": display_special_idx,
                    "output_distribution": {
                        "top_k": request.top_k,
                        "candidates": candidates,
                    },
                    "selected_token": {
                        "token": selected_token,
                        "token_id": selected_token_id,
                        "selection_method": selection_method,
                        "special": selected_token_id in special_token_ids,
                    },
                }

                generation_steps.append(step_data)

                # After recording the step, append the selected token to the generated stream
                generated_tokens.append(selected_token)
                generated_token_ids.append(selected_token_id)

                # Append selected token to current_ids (for the actual model)
                current_ids = torch.cat(
                    [
                        current_ids,
                        torch.tensor([[selected_token_id]], device=config_args.device),
                    ],
                    dim=1,
                )

                # Check for EOS token
                if selected_token_id in eos_token_ids:
                    logger.info(f"EOS token reached at step {step}")
                    break

        return {
            "prompt": request.prompt,
            "formatted_prompt": text,
            "generation_steps": generation_steps,
            "max_new_tokens": request.max_new_tokens,
            "top_k": request.top_k,
            "temperature": request.temperature,
        }

    except Exception as e:
        logger.error(f"Error in generate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="FastAPI server for LLM inference visualization"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="openai-community/gpt2-xl",
        help="Model ID from Hugging Face Hub (only loaded at startup with --preload)",
    )
    parser.add_argument(
        "--preload",
        action="store_true",
        help="Load --model at startup. Off by default: the generation scripts "
        "POST /load_model for every model, so preloading only wastes time.",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cuda" if torch.cuda.is_available() else "cpu",
        choices=["cuda", "cpu"],
        help="Device to run the model on",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind the server to",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8712,
        help="Port to bind the server to",
    )

    config_args = parser.parse_args()

    uvicorn.run(app, host=config_args.host, port=config_args.port)
