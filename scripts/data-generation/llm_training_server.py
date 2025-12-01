"""
FastAPI server for generating training visualization data.
Uses pre-trained Meta-Llama/Llama-3.2-1B and collects predictions for training examples.
"""

import logging
from typing import Dict, List, Optional

import torch
import torch.nn.functional as F
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "meta-llama/Llama-3.2-1B"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

app = FastAPI(title="LLM Training Visualization API")

# Global variables for model and tokenizer
tokenizer = None
model = None


class TrainingRequest(BaseModel):
    text: str
    source: str
    max_tokens: Optional[int] = None  # If None, use full text


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
    global tokenizer, model

    logger.info(f"Loading pre-trained model: {MODEL_NAME}")
    logger.info(f"Device: {DEVICE}")

    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

        # Load pre-trained model
        logger.info("Loading pre-trained Llama-3.2-1B model...")
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
            device_map="auto" if DEVICE == "cuda" else None,
        )

        if DEVICE == "cpu":
            model = model.to(DEVICE)

        # Set to evaluation mode (no dropout)
        model.eval()

        # Log model size
        num_params = sum(p.numel() for p in model.parameters())
        logger.info(f"Model loaded successfully")
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
        "model": MODEL_NAME,
        "device": DEVICE,
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
        "name": MODEL_NAME,
        "architecture": config.model_type,
        "num_layers": config.num_hidden_layers,
        "hidden_size": config.hidden_size,
        "num_attention_heads": config.num_attention_heads,
        "vocab_size": config.vocab_size,
        "max_position_embeddings": config.max_position_embeddings,
        "intermediate_size": config.intermediate_size,
        "total_parameters": num_params,
        "pretrained": True,
    }


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
        input_ids = torch.tensor([token_ids], device=DEVICE)

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
                    torch.tensor([target_token_id], device=DEVICE),
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
    uvicorn.run(app, host="0.0.0.0", port=8666)
