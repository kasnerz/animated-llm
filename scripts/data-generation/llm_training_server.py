"""
FastAPI server for generating training visualization data.
Collects next-token predictions over a text for whichever model is loaded via
/load_model, optionally with randomly initialized weights (Vanilla Transformer).
"""

import argparse
import logging
from typing import Dict, List, Optional

import torch
import torch.nn.functional as F
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoConfig, AutoModelForCausalLM

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

app = FastAPI(title="LLM Training Visualization API")

# Global variables for model and tokenizer
tokenizer = None
model = None
display_model_name = None
special_token_ids = set()

# Global configuration
config_args = None


class TrainingRequest(BaseModel):
    text: str
    source: str
    max_tokens: Optional[int] = None  # If None, use full text


class LoadModelRequest(BaseModel):
    model_id: str
    random_weights: bool = False


class TokenCandidate(BaseModel):
    token: str
    token_id: int
    logprob: float
    prob: float


class TrainingStep(BaseModel):
    step: int
    input_tokens: List[str]
    input_token_ids: List[int]
    target_token: str
    target_token_id: int
    predictions: List[TokenCandidate]
    target_prob: float
    target_logprob: float
    loss: float


def load_model_and_tokenizer(model_id: str, random_weights: bool):
    """Load `model_id` into the module globals, replacing anything already loaded."""
    global tokenizer, model, display_model_name, special_token_ids

    logger.info(f"Loading model configuration: {model_id}")
    logger.info(f"Device: {config_args.device}")
    logger.info(f"Use random weights: {random_weights}")

    # Clear previous model from memory
    if model is not None:
        del model
        model = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    tokenizer = load_tokenizer(model_id)

    if random_weights:
        logger.info("Initializing random weights (Vanilla Transformer)...")
        config = AutoConfig.from_pretrained(model_id)
        model = AutoModelForCausalLM.from_config(config)
        display_model_name = "Vanilla Transformer"
    else:
        logger.info(f"Loading pre-trained {model_id} model...")
        # "auto" keeps each model in the dtype it was released in. Forcing
        # float16 would be wrong for bf16-native models such as Gemma 4, whose
        # logit softcapping makes it sensitive to the narrower fp16 range.
        model = load_causal_lm(model_id, config_args.device)
        display_model_name = model_id

    if random_weights:
        model = model.to(config_args.device)
        if config_args.device == "cuda":
            model = model.half()

    # Set to evaluation mode (no dropout)
    model.eval()
    special_token_ids = get_special_token_ids(tokenizer)

    config_args.model = model_id
    config_args.random_weights = random_weights

    # Log model size
    num_params = sum(p.numel() for p in model.parameters())

    if random_weights:
        display_model_name = f"Vanilla Transformer ({num_params/1e9:.1f}B)"

    logger.info(f"Model loaded successfully: {display_model_name}")
    logger.info(f"Total parameters: {num_params:,}")
    logger.info(f"Model size: ~{num_params * 2 / (1024**3):.2f} GB (float16)")
    logger.info(f"Special/control token ids: {len(special_token_ids)}")


@app.on_event("startup")
async def startup_load_model():
    """Optionally preload a model on startup; otherwise wait for /load_model."""
    if not config_args.preload:
        logger.info("Starting without a model - POST /load_model to load one")
        return

    load_model_and_tokenizer(config_args.model, config_args.random_weights)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LLM Training Visualization API",
        "model": display_model_name,
        "device": config_args.device,
        "endpoints": {
            "model_info": "/model_info",
            "process_training": "/process_training",
        },
    }


@app.get("/model_info")
async def get_model_info():
    """Get model information."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    num_params = sum(p.numel() for p in model.parameters())
    description = describe_config(model.config)

    return {
        "name": display_model_name,
        "architecture": model.config.model_type,
        "num_layers": description["num_layers"],
        "hidden_size": description["hidden_size"],
        "num_attention_heads": description["num_attention_heads"],
        "vocab_size": description["vocab_size"],
        "max_position_embeddings": description["max_position_embeddings"],
        "intermediate_size": description["intermediate_size"],
        "total_parameters": num_params,
        "pretrained": not config_args.random_weights,
    }


@app.post("/load_model")
async def load_model_endpoint(request: LoadModelRequest):
    """Load a new model dynamically."""
    logger.info(f"Loading new model: {request.model_id}")
    logger.info(f"Random weights: {request.random_weights}")

    try:
        load_model_and_tokenizer(request.model_id, request.random_weights)

        return {
            "status": "success",
            "model": display_model_name,
            "message": "Model loaded successfully",
        }

    except Exception as e:
        logger.error(f"Error loading model {request.model_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@app.post("/process_training")
async def process_training(request: TrainingRequest):
    """
    Process a training example and collect predictions for each token.

    For a given text, this endpoint:
    1. Tokenizes the input
    2. For each position i (from 0 to len-1):
       - Uses tokens[0:i] as input
       - Predicts token[i]
       - Collects probability distribution and loss
    """
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Tokenize the input text
        encoding = tokenizer(request.text, return_tensors="pt")
        token_ids = encoding.input_ids[0].tolist()

        # Make sure the sequence starts with BOS. Some instruction-tuned
        # tokenizers leave it out of the post-processor because their chat
        # template emits it literally (gemma-4-E4B-it does this, while the base
        # gemma-4-E4B adds it). Without BOS these models predict from an
        # out-of-distribution first position and the probabilities are garbage.
        bos_token_id = getattr(tokenizer, "bos_token_id", None)
        if bos_token_id is not None and (not token_ids or token_ids[0] != bos_token_id):
            token_ids.insert(0, bos_token_id)

        tokens = get_display_tokens(tokenizer, token_ids)

        # Limit tokens if max_tokens is specified
        if request.max_tokens is not None and len(token_ids) > request.max_tokens:
            token_ids = token_ids[: request.max_tokens]
            tokens = tokens[: request.max_tokens]

        num_tokens = len(token_ids)
        logger.info(f"Processing training example with {num_tokens} tokens")

        training_steps = []

        # Move input to device
        input_ids = torch.tensor([token_ids], device=config_args.device)

        with torch.no_grad():
            # Get model outputs for the full sequence
            outputs = model(input_ids)
            logits = outputs.logits[0]  # Shape: [seq_len, vocab_size]

            # Process each position (except the first, as there's no previous context)
            for step in range(num_tokens):
                # Input is everything before this position
                input_token_ids = token_ids[:step] if step > 0 else []
                input_tokens = tokens[:step] if step > 0 else []

                # Target is the current token
                target_token_id = token_ids[step]
                target_token = tokens[step]

                if step > 0:
                    # Get predictions from the previous position
                    step_logits = logits[step - 1]  # Predictions for position step
                else:
                    # For the first token, we predict from empty context
                    # In GPT-2, this is typically the BOS prediction
                    # For simplicity, we'll use the first position's logits
                    step_logits = logits[0]

                # Compute probabilities
                probs = F.softmax(step_logits, dim=-1)
                log_probs = F.log_softmax(step_logits, dim=-1)

                # Get top-k predictions (k=10 for consistency with inference)
                top_k = 10
                top_k_probs, top_k_indices = torch.topk(probs, k=top_k)
                top_k_log_probs = log_probs[top_k_indices]

                # Convert to lists
                top_k_tokens = get_display_tokens(tokenizer, top_k_indices.tolist())
                top_k_token_ids = top_k_indices.tolist()
                top_k_probs_list = top_k_probs.tolist()
                top_k_log_probs_list = top_k_log_probs.tolist()

                # Get target token probability and loss
                target_prob = probs[target_token_id].item()
                target_logprob = log_probs[target_token_id].item()
                loss = F.cross_entropy(
                    step_logits.unsqueeze(0),
                    torch.tensor([target_token_id], device=config_args.device),
                ).item()

                # Build predictions list
                predictions = [
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

                # Create training step
                step_data = {
                    "step": step,
                    "input_tokens": input_tokens,
                    "input_token_ids": input_token_ids,
                    "target_token": target_token,
                    "target_token_id": target_token_id,
                    "predictions": predictions,
                    "target_token_prediction": {
                        "token": target_token,
                        "token_id": target_token_id,
                        "logprob": round(target_logprob, 4),
                        "prob": round(target_prob, 4),
                    },
                    "target_prob": round(target_prob, 4),
                    "target_logprob": round(target_logprob, 4),
                    "loss": round(loss, 4),
                }

                training_steps.append(step_data)

        return {
            "text": request.text,
            "source": request.source,
            "tokens": tokens,
            "token_ids": token_ids,
            # Positions of control tokens (e.g. the <bos> the tokenizer prepends)
            # so the frontend can hide them without pattern-matching strings.
            "special_idx": special_indices(token_ids, special_token_ids),
            "num_tokens": num_tokens,
            "training_steps": training_steps,
        }

    except Exception as e:
        logger.error(f"Error processing training example: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="FastAPI server for LLM training visualization"
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
        "--random-weights",
        action="store_true",
        help="Use randomly initialized weights (Vanilla Transformer)",
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
