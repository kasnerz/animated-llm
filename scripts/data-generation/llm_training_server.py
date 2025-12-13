"""
FastAPI server for generating training visualization data.
Uses pre-trained Meta-Llama/Llama-3.2-1B and collects predictions for training examples.
"""

import argparse
import logging
from typing import Dict, List, Optional

import torch
import torch.nn.functional as F
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoConfig, AutoModelForCausalLM, AutoTokenizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Training Visualization API")

# Global variables for model and tokenizer
tokenizer = None
model = None
display_model_name = None

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


def get_display_tokens(tokenizer, token_ids: List[int]) -> List[str]:
    """
    Decodes token IDs into strings, replacing leading spaces with 'Ġ' for display.
    """
    tokens = []
    for token_id in token_ids:
        # Decode the single token
        decoded_token = tokenizer.decode([token_id])
        # convert_ids_to_tokens gives the raw token, which might be what we want for display
        raw_token = tokenizer.convert_ids_to_tokens([token_id])[0]

        # If the raw token starts with Ġ, it signifies a space.
        # The decoded token will have a space " " at the beginning.
        # We prefer the raw token for display if it's valid unicode
        if raw_token.startswith("Ġ"):
            # We want to show the Ġ, but the rest of the token might be garbled
            # if we just use the raw token. So we take the decoded token and prepend Ġ.
            # The decoded token will have a leading space if the raw token had a Ġ.
            if decoded_token.startswith(" "):
                tokens.append("Ġ" + decoded_token[1:])
            else:
                # This case is unlikely but as a fallback, use the raw token
                tokens.append(raw_token)
        else:
            tokens.append(decoded_token)
    return tokens


@app.on_event("startup")
async def load_model():
    """Load the model and tokenizer on startup."""
    global tokenizer, model, display_model_name

    logger.info(f"Loading model configuration: {config_args.model}")
    logger.info(f"Device: {config_args.device}")
    logger.info(f"Use random weights: {config_args.random_weights}")

    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(config_args.model)

        if config_args.random_weights:
            logger.info("Initializing random weights (Vanilla Transformer)...")
            config = AutoConfig.from_pretrained(config_args.model)
            model = AutoModelForCausalLM.from_config(config)
            display_model_name = "Vanilla Transformer"
        else:
            # Load pre-trained model
            logger.info(f"Loading pre-trained {config_args.model} model...")
            model = AutoModelForCausalLM.from_pretrained(
                config_args.model,
                torch_dtype=(
                    torch.float16 if config_args.device == "cuda" else torch.float32
                ),
                device_map="auto" if config_args.device == "cuda" else None,
            )
            display_model_name = config_args.model

        if config_args.device == "cpu" or config_args.random_weights:
            model = model.to(config_args.device)
            if config_args.device == "cuda" and config_args.random_weights:
                model = model.half()

        # Set to evaluation mode (no dropout)
        model.eval()

        # Log model size
        num_params = sum(p.numel() for p in model.parameters())

        if config_args.random_weights:
            display_model_name = f"Vanilla Transformer ({num_params/1e9:.1f}B)"

        logger.info(f"Model loaded successfully: {display_model_name}")
        logger.info(f"Total parameters: {num_params:,}")
        logger.info(f"Model size: ~{num_params * 2 / (1024**3):.2f} GB (float16)")

    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise


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
    config = model.config

    return {
        "name": display_model_name,
        "architecture": config.model_type,
        "num_layers": config.num_hidden_layers,
        "hidden_size": config.hidden_size,
        "num_attention_heads": config.num_attention_heads,
        "vocab_size": config.vocab_size,
        "max_position_embeddings": config.max_position_embeddings,
        "intermediate_size": config.intermediate_size,
        "total_parameters": num_params,
        "pretrained": not config_args.random_weights,
    }


@app.post("/load_model")
async def load_model_endpoint(request: LoadModelRequest):
    """Load a new model dynamically."""
    global tokenizer, model, display_model_name

    logger.info(f"Loading new model: {request.model_id}")
    logger.info(f"Random weights: {request.random_weights}")

    try:
        # Clear previous model from memory
        if model is not None:
            del model
            del tokenizer
            torch.cuda.empty_cache() if torch.cuda.is_available() else None

        # Update config
        config_args.model = request.model_id
        config_args.random_weights = request.random_weights

        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            request.model_id,
            use_fast=True,
            trust_remote_code=True,
        )

        if request.random_weights:
            logger.info("Initializing random weights (Vanilla Transformer)...")
            from transformers import AutoConfig

            config = AutoConfig.from_pretrained(request.model_id)
            model = AutoModelForCausalLM.from_config(config)
            display_model_name = "Vanilla Transformer"
        else:
            # Load pre-trained model
            logger.info(f"Loading pre-trained {request.model_id} model...")
            model = AutoModelForCausalLM.from_pretrained(
                request.model_id,
                torch_dtype=(
                    torch.float16 if config_args.device == "cuda" else torch.float32
                ),
                device_map="auto" if config_args.device == "cuda" else None,
                low_cpu_mem_usage=True,
                use_safetensors=True,
                trust_remote_code=True,
            )
            display_model_name = request.model_id

        if config_args.device == "cpu" or request.random_weights:
            model = model.to(config_args.device)
            if config_args.device == "cuda" and request.random_weights:
                model = model.half()

        # Set to evaluation mode (no dropout)
        model.eval()

        # Log model size
        num_params = sum(p.numel() for p in model.parameters())

        if request.random_weights:
            display_model_name = f"Vanilla Transformer ({num_params/1e9:.1f}B)"

        logger.info(f"Model loaded successfully: {display_model_name}")
        logger.info(f"Total parameters: {num_params:,}")

        return {
            "status": "success",
            "model": display_model_name,
            "message": f"Model loaded successfully",
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
        default="meta-llama/Llama-3.2-1B",
        help="Model ID from Hugging Face Hub",
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
