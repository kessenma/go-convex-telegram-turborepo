import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

# Set environment variables for optimal CPU performance
os.environ["OMP_NUM_THREADS"] = "8"  # Increased for llama-cpp
os.environ["MKL_NUM_THREADS"] = "8" 
os.environ["OPENBLAS_NUM_THREADS"] = "8"
os.environ["NUMEXPR_NUM_THREADS"] = "8"
os.environ["VECLIB_MAXIMUM_THREADS"] = "8"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import psutil
import gc
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model
llm = None

# Model configuration - Using Phi-3 GGUF for fast RAG performance
MODEL_PATH = os.getenv("MODEL_PATH", "./Phi-3-mini-4k-instruct-q4.gguf")
N_CTX = int(os.getenv("N_CTX", "4096"))  # Context window
N_THREADS = int(os.getenv("N_THREADS", "8"))  # CPU threads
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", "0"))  # GPU layers (0 for CPU only)

MAX_TOKENS = 512
TEMPERATURE = 0.7
TOP_P = 0.9

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
    model_path: str

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
    """Load the Phi-3 GGUF model using llama-cpp-python"""
    global llm
    
    try:
        logger.info(f"Loading Phi-3 model from: {MODEL_PATH}")
        logger.info(f"Context window: {N_CTX}, Threads: {N_THREADS}, GPU layers: {N_GPU_LAYERS}")
        
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        # Initialize the Llama model with conservative settings
        llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=N_CTX,
            n_threads=N_THREADS,
            n_gpu_layers=N_GPU_LAYERS,
            verbose=True,   # Enable verbose for debugging
            use_mmap=True,  # Use memory mapping for efficiency
            use_mlock=False, # Disable mlock to avoid permission issues
            n_batch=256,    # Smaller batch size for stability
            f16_kv=True,    # Use 16-bit for key-value cache
        )
        
        logger.info("Phi-3 model loaded successfully")
        logger.info(f"Memory usage after loading: {get_memory_usage()}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise e

def cleanup_model():
    """Clean up model resources"""
    global llm
    
    if llm is not None:
        del llm
        llm = None
    
    # Force garbage collection
    gc.collect()
    
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
    """Format the chat prompt for Llama-3.2 with proper chat template and RAG support"""
    if conversation_history is None:
        conversation_history = []
    
    # Llama-3.2 uses this format: <|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nsystem_message<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nuser_message<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n
    
    # System message for RAG
    if context.strip():
        # For RAG, include context in system message
        max_context_length = 1500  # Be conservative with context length
        if len(context) > max_context_length:
            # Try to truncate at sentence boundaries
            truncated_context = context[:max_context_length]
            last_period = truncated_context.rfind('.')
            if last_period > max_context_length * 0.7:
                truncated_context = truncated_context[:last_period + 1]
            else:
                truncated_context = truncated_context + "..."
        else:
            truncated_context = context
        
        system_msg = f"You are a helpful AI assistant. Answer questions based on the provided document information. Be concise and accurate.\n\nDocument Information:\n{truncated_context}"
    else:
        system_msg = "You are a helpful AI assistant. Provide clear, concise, and accurate responses."
    
    # Build the chat prompt using Llama-3.2's format
    prompt = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_msg}<|eot_id|>"
    
    # Add conversation history (keep last 2 exchanges)
    if conversation_history:
        recent_history = conversation_history[-2:]
        for exchange in recent_history:
            if exchange.get('role') == 'user':
                prompt += f"<|start_header_id|>user<|end_header_id|>\n\n{exchange['content']}<|eot_id|>"
            elif exchange.get('role') == 'assistant':
                prompt += f"<|start_header_id|>assistant<|end_header_id|>\n\n{exchange['content']}<|eot_id|>"
    
    # Add current message
    prompt += f"<|start_header_id|>user<|end_header_id|>\n\n{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    return prompt

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=llm is not None,
        memory_usage=get_memory_usage(),
        model_path=MODEL_PATH
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate a chat response using Phi-3 via llama-cpp"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Format the prompt
        prompt = format_chat_prompt(
            message=request.message,
            context=request.context,
            conversation_history=request.conversation_history
        )
        
        logger.info(f"Generating response for message: {request.message[:100]}...")
        logger.info(f"Formatted prompt: {prompt[:200]}...")
        
        # Generate response using llama-cpp
        max_tokens = min(request.max_length or MAX_TOKENS, MAX_TOKENS)
        temperature = request.temperature or TEMPERATURE
        
        start_time = time.time()
        
        # Generate response
        output = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=TOP_P,
            stop=["<|eot_id|>", "<|start_header_id|>", "<|end_of_text|>"],  # Stop tokens for Llama-3.2
            echo=False  # Don't include the prompt in the output
        )
        
        generation_time = time.time() - start_time
        
        # Extract the response text
        generated_text = output["choices"][0]["text"].strip()
        
        # Clean up any remaining special tokens
        generated_text = generated_text.replace("<|eot_id|>", "").replace("<|start_header_id|>", "").replace("<|end_of_text|>", "").strip()
        
        # If no text was generated, provide a fallback
        if not generated_text or len(generated_text.strip()) == 0:
            generated_text = "I'm here and ready to help! How can I assist you today?"
            logger.warning("No text generated, using fallback response")
        
        # Extract usage information
        usage = output.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", 0)
        
        logger.info(f"Response generated successfully in {generation_time:.2f}s")
        logger.info(f"Tokens - Prompt: {prompt_tokens}, Completion: {completion_tokens}, Total: {total_tokens}")
        
        return ChatResponse(
            response=generated_text,
            model_info={
                "model_name": "Llama-3.2-1B-Instruct",
                "model_path": MODEL_PATH,
                "context_window": N_CTX,
                "temperature": temperature,
                "generation_time_s": round(generation_time, 2)
            },
            usage={
                "input_tokens": prompt_tokens,
                "output_tokens": completion_tokens,
                "total_tokens": total_tokens
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "Phi-3-mini-4k-instruct",
        "model_path": MODEL_PATH,
        "context_window": N_CTX,
        "threads": N_THREADS,
        "gpu_layers": N_GPU_LAYERS,
        "memory_usage": get_memory_usage(),
        "model_exists": os.path.exists(MODEL_PATH)
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
