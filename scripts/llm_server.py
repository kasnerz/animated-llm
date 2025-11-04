"""
FastAPI server for generating LLM visualization data.
Provides endpoints for tokenization, token IDs, and token probability distributions.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_ID = "meta-llama/Llama-3.2-1B-Instruct"  # Change this to your desired model
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

app = FastAPI(title="LLM Visualization API")

# Global variables for model and tokenizer
tokenizer = None
model = None


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
    apply_chat_template: bool = True


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


@app.on_event("startup")
async def load_model():
    """Load the model and tokenizer on startup."""
    global tokenizer, model
    
    logger.info(f"Loading model: {MODEL_ID}")
    logger.info(f"Device: {DEVICE}")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
            device_map="auto" if DEVICE == "cuda" else None,
        )
        
        if DEVICE == "cpu":
            model = model.to(DEVICE)
        
        model.eval()
        logger.info("Model loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LLM Visualization API",
        "model": MODEL_ID,
        "device": DEVICE,
        "endpoints": {
            "tokenize": "/tokenize",
            "token_ids": "/token_ids",
            "generate": "/generate"
        }
    }


@app.get("/model_info")
async def get_model_info():
    """Get model information."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    config = model.config
    return {
        "name": MODEL_ID,
        "num_layers": config.num_hidden_layers,
        "hidden_size": config.hidden_size,
        "num_attention_heads": config.num_attention_heads,
        "vocab_size": config.vocab_size,
    }


@app.post("/tokenize")
async def tokenize(request: TokenizeRequest):
    """Tokenize the input prompt."""
    if tokenizer is None:
        raise HTTPException(status_code=503, detail="Tokenizer not loaded")
    
    try:
        text = request.prompt
        
        if request.apply_chat_template:
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
        
        # Tokenize
        tokens = tokenizer.tokenize(text)
        
        return {
            "prompt": request.prompt,
            "formatted_text": text,
            "tokens": tokens,
            "num_tokens": len(tokens)
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
        
        if request.apply_chat_template:
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
        
        # Tokenize and get IDs
        encoding = tokenizer(text, return_tensors="pt")
        token_ids = encoding.input_ids[0].tolist()
        tokens = tokenizer.convert_ids_to_tokens(token_ids)
        
        return {
            "prompt": request.prompt,
            "formatted_text": text,
            "tokens": tokens,
            "token_ids": token_ids,
            "num_tokens": len(token_ids)
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
        
        if request.apply_chat_template:
            messages = [{"role": "user", "content": request.prompt}]
            text = tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
            # Get the number of tokens in the original prompt (for display purposes)
            prompt_only_ids = tokenizer(request.prompt, return_tensors="pt").input_ids
            prompt_token_count = prompt_only_ids.shape[1]
        
        # Encode input
        input_ids = tokenizer(text, return_tensors="pt").input_ids.to(DEVICE)
        
        generation_steps = []
        current_ids = input_ids.clone()
        
        # Track generated tokens separately from the formatted prompt
        generated_tokens = []
        generated_token_ids = []
        
        with torch.no_grad():
            for step in range(request.max_new_tokens):
                # Get model outputs
                outputs = model(current_ids)
                logits = outputs.logits[:, -1, :]  # Get logits for the last token
                
                # Calculate probabilities
                probs = torch.softmax(logits, dim=-1)
                log_probs = torch.log_softmax(logits, dim=-1)
                
                # Get top-k tokens
                top_k_probs, top_k_indices = torch.topk(probs[0], k=request.top_k)
                top_k_log_probs = log_probs[0][top_k_indices]
                
                # Convert to lists
                top_k_tokens = [tokenizer.decode([idx.item()]) for idx in top_k_indices]
                top_k_token_ids = top_k_indices.tolist()
                top_k_probs_list = top_k_probs.tolist()
                top_k_log_probs_list = top_k_log_probs.tolist()
                
                # Select next token (greedy) — but do NOT add it to the displayed input yet
                selected_token_id = top_k_indices[0].item()
                selected_token = top_k_tokens[0]

                # For display: show only the original prompt + tokens generated so far (exclude current selection)
                if request.apply_chat_template:
                    # Tokenize the original prompt for display (without any trailing spaces)
                    prompt_token_ids = tokenizer(request.prompt.rstrip(), return_tensors="pt", add_special_tokens=False).input_ids[0].tolist()
                    prompt_tokens = tokenizer.convert_ids_to_tokens(prompt_token_ids)
                    
                    # Filter out special tokens like <|begin_of_text|>
                    filtered_prompt_tokens = []
                    filtered_prompt_token_ids = []
                    for tok, tok_id in zip(prompt_tokens, prompt_token_ids):
                        if not (tok.startswith("<|") and tok.endswith("|>")):
                            filtered_prompt_tokens.append(tok)
                            filtered_prompt_token_ids.append(tok_id)
                    
                    display_tokens = filtered_prompt_tokens + generated_tokens
                    display_token_ids = filtered_prompt_token_ids + generated_token_ids
                    
                    # Add space after prompt before generated tokens
                    if generated_tokens:
                        display_text = request.prompt + " " + "".join(generated_tokens)
                    else:
                        display_text = request.prompt
                else:
                    # Without chat template, show the input up to now (exclude current selection)
                    display_tokens = tokenizer.convert_ids_to_tokens(current_ids[0].tolist())
                    display_token_ids = current_ids[0].tolist()
                    display_text = tokenizer.decode(current_ids[0], skip_special_tokens=False)
                
                # Build candidates list
                candidates = [
                    {
                        "token": token,
                        "token_id": token_id,
                        "logprob": round(log_prob, 4),
                        "prob": round(prob, 4)
                    }
                    for token, token_id, log_prob, prob in zip(
                        top_k_tokens, top_k_token_ids, top_k_log_probs_list, top_k_probs_list
                    )
                ]
                
                # Create generation step
                step_data = {
                    "step": step,
                    "input_text": display_text,
                    "tokens": display_tokens,
                    "token_ids": display_token_ids,
                    "output_distribution": {
                        "top_k": request.top_k,
                        "candidates": candidates
                    },
                    "selected_token": {
                        "token": selected_token,
                        "token_id": selected_token_id,
                        "selection_method": "greedy"
                    }
                }
                
                generation_steps.append(step_data)
                
                # After recording the step, append the selected token to the generated stream
                generated_tokens.append(selected_token)
                generated_token_ids.append(selected_token_id)

                # Append selected token to current_ids (for the actual model)
                current_ids = torch.cat([
                    current_ids,
                    torch.tensor([[selected_token_id]], device=DEVICE)
                ], dim=1)
                
                # Check for EOS token
                if selected_token_id == tokenizer.eos_token_id:
                    logger.info(f"EOS token reached at step {step}")
                    break
        
        return {
            "prompt": request.prompt,
            "formatted_prompt": text,
            "generation_steps": generation_steps,
            "max_new_tokens": request.max_new_tokens,
            "top_k": request.top_k
        }
    
    except Exception as e:
        logger.error(f"Error in generate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
