import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    pipeline,
    BitsAndBytesConfig
)
import psutil
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model and tokenizer
model = None
tokenizer = None
text_generator = None

# Model configuration - Using a lightweight model optimized for RAG
MODEL_NAME = "distilgpt2"  # Ultra-lightweight, reliable for M1 Pro
# Best lightweight options for RAG on M1 Pro:
# MODEL_NAME = "distilgpt2"  # Ultra-lightweight, reliable
# MODEL_NAME = "gpt2"  # Slightly larger but good quality
# MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # Good but may be too large

MAX_LENGTH = 1024  # DistilGPT2 supports up to 1024 tokens
TEMPERATURE = 0.7
TOP_P = 0.9
DO_SAMPLE = True

class ChatRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    message: str
    context: str = ""
    conversation_history: List[Dict[str, str]] = []
    max_length: Optional[int] = 512
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    response: str
    model_info: Dict[str, Any]
    usage: Dict[str, Any]

class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    memory_usage: Dict[str, Any]
    gpu_available: bool

def get_memory_usage():
    """Get current memory usage statistics"""
    process = psutil.Process()
    memory_info = process.memory_info()
    
    return {
        "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
        "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
        "percent": round(process.memory_percent(), 2),
        "available_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2)
    }

def load_model():
    """Load the lightweight LLM model"""
    global model, tokenizer, text_generator
    
    try:
        logger.info(f"Loading model: {MODEL_NAME}")
        
        # Check if CUDA is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Configure quantization for memory efficiency
        if device == "cuda":
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
        else:
            quantization_config = None
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            cache_dir="/app/cache/transformers"
        )
        
        # Add padding token if it doesn't exist
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=quantization_config,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            trust_remote_code=True,
            cache_dir="/app/cache/transformers"
        )
        
        # Create text generation pipeline
        text_generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        
        logger.info("Model loaded successfully")
        logger.info(f"Memory usage after loading: {get_memory_usage()}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise e

def cleanup_model():
    """Clean up model resources"""
    global model, tokenizer, text_generator
    
    if model is not None:
        del model
        model = None
    
    if tokenizer is not None:
        del tokenizer
        tokenizer = None
        
    if text_generator is not None:
        del text_generator
        text_generator = None
    
    # Force garbage collection
    gc.collect()
    
    # Clear CUDA cache if available
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    logger.info("Model cleanup completed")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting lightweight LLM service...")
    load_model()
    yield
    # Shutdown
    logger.info("Shutting down lightweight LLM service...")
    cleanup_model()

# Create FastAPI app
app = FastAPI(
    title="Lightweight LLM Service",
    description="A lightweight self-hosted LLM service for document chat",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_chat_prompt(message: str, context: str = "", conversation_history: List[Dict[str, str]] = None) -> str:
    """Format the chat prompt for DistilGPT2 with simple instruction format"""
    if conversation_history is None:
        conversation_history = []
    
    # DistilGPT2 works best with simple text completion format
    # Build a simple prompt with context and conversation
    
    prompt = "You are a helpful AI assistant that answers questions based on the provided context.\n\n"
    
    # Add context if provided (allow more context for RAG)
    if context.strip():
        # For RAG, we want to include more context
        max_context_length = 400  # Reduced for DistilGPT2's smaller context window
        if len(context) > max_context_length:
            truncated_context = context[:max_context_length] + "..."
        else:
            truncated_context = context
        prompt += f"Context: {truncated_context}\n\n"
    
    # Add conversation history (keep last 1 exchange to save tokens)
    if conversation_history:
        recent_history = conversation_history[-1:]
        for exchange in recent_history:
            if exchange.get('role') == 'user':
                prompt += f"Human: {exchange['content']}\n"
            elif exchange.get('role') == 'assistant':
                prompt += f"Assistant: {exchange['content']}\n"
    
    # Add current message
    prompt += f"Human: {message}\nAssistant:"
    
    return prompt

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        memory_usage=get_memory_usage(),
        gpu_available=torch.cuda.is_available()
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate a chat response using the lightweight LLM"""
    if model is None or tokenizer is None or text_generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Format the prompt
        prompt = format_chat_prompt(
            message=request.message,
            context=request.context,
            conversation_history=request.conversation_history
        )
        
        logger.info(f"Generating response for message: {request.message[:100]}...")
        
        # Generate response
        max_length = min(request.max_length or MAX_LENGTH, MAX_LENGTH)
        temperature = request.temperature or TEMPERATURE
        
        # Count input tokens and ensure we don't exceed model limits
        input_tokens = len(tokenizer.encode(prompt))
        logger.info(f"Initial prompt tokens: {input_tokens}")
        
        # DistilGPT2 has a max length of 1024 tokens
        # We need to ensure input + output doesn't exceed this
        max_input_tokens = 700  # Conservative for DistilGPT2
        
        if input_tokens > max_input_tokens:
            # Truncate the prompt if it's too long
            encoded_prompt = tokenizer.encode(prompt)
            truncated_prompt = tokenizer.decode(encoded_prompt[:max_input_tokens], skip_special_tokens=True)
            prompt = truncated_prompt
            input_tokens = len(tokenizer.encode(prompt))
            logger.warning(f"Prompt truncated from {len(encoded_prompt)} to {input_tokens} tokens")
        
        # Adjust max_new_tokens to ensure total doesn't exceed model limit
        max_new_tokens = min(max_length, 1024 - input_tokens - 50)  # 50 token safety buffer
        max_new_tokens = max(10, max_new_tokens)  # Ensure at least 10 tokens for output
        
        logger.info(f"Final prompt tokens: {input_tokens}, max_new_tokens: {max_new_tokens}")
        
        # For DistilGPT2, encode the prompt properly
        input_ids = tokenizer.encode(prompt, return_tensors='pt')
        
        # Generate response using the model directly
        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=TOP_P,
                do_sample=DO_SAMPLE,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                no_repeat_ngram_size=2,
                repetition_penalty=1.1,
                early_stopping=True,
                num_return_sequences=1
            )
        
        # Decode the full output and extract the response
        full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the assistant's response (everything after "Assistant:")
        if "Assistant:" in full_output:
            # Split by "Assistant:" and take the last part
            assistant_responses = full_output.split("Assistant:")
            if len(assistant_responses) > 1:
                generated_text = assistant_responses[-1].strip()
                # Clean up any remaining conversation markers
                generated_text = generated_text.split("Human:")[0].strip()
            else:
                generated_text = ""
        else:
            # Fallback: take everything after the original prompt
            generated_text = full_output[len(prompt):].strip()
        
        # If no text was generated, provide a fallback
        if not generated_text or len(generated_text.strip()) == 0:
            generated_text = "I'm here and ready to help! How can I assist you today?"
            logger.warning("No text generated, using fallback response")
        
        # Count output tokens
        output_tokens = len(tokenizer.encode(generated_text))
        
        logger.info(f"Response generated successfully. Input tokens: {input_tokens}, Output tokens: {output_tokens}")
        
        return ChatResponse(
            response=generated_text,
            model_info={
                "model_name": MODEL_NAME,
                "device": "cuda" if torch.cuda.is_available() else "cpu",
                "max_length": max_length,
                "temperature": temperature
            },
            usage={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": MODEL_NAME,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "memory_usage": get_memory_usage(),
        "model_parameters": sum(p.numel() for p in model.parameters()),
        "model_size_mb": sum(p.numel() * p.element_size() for p in model.parameters()) / 1024 / 1024
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8082
    port = int(os.getenv("PORT", 8082))
    
    logger.info(f"Starting server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
