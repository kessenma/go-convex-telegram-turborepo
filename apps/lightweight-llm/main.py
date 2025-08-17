import os
import re
import logging
import asyncio
import importlib.util
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
from status_reporter import StatusReporter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model
llm = None
status_reporter = None
title_generator = None

# Model configuration - Using Llama 3.2 1B GGUF for fast RAG performance
MODEL_PATH = os.getenv("MODEL_PATH", "./llama-3.2-1b-instruct-q4.gguf")
N_CTX = int(os.getenv("N_CTX", "4096"))  # Context window
N_THREADS = int(os.getenv("N_THREADS", "8"))  # CPU threads
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", "0"))  # GPU layers (0 for CPU only)

# Status reporting configuration
CONVEX_URL = os.getenv("CONVEX_URL", "http://localhost:3211")
SERVICE_NAME = "lightweight-llm"

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
    conversation_id: Optional[str] = None
    is_new_conversation: Optional[bool] = False

class ChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    response: str
    model_info: Dict[str, Any]
    usage: Dict[str, Any]
    rag_metadata: Optional[Dict[str, Any]] = None
    generated_title: Optional[str] = None

class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    memory_usage: Dict[str, Any]
    model_path: str

def get_memory_usage():
    """Get current memory usage statistics"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        cpu_percent = process.cpu_percent(interval=0.1)  # Get CPU usage
        
        # Get system memory info
        system_memory = psutil.virtual_memory()
        
        return {
            "process_memory_mb": round(memory_info.rss / 1024 / 1024, 2),
            "process_memory_percent": round(memory_percent, 2),
            "process_cpu_percent": round(cpu_percent, 2),
            "system_memory_total_gb": round(system_memory.total / 1024 / 1024 / 1024, 2),
            "system_memory_available_gb": round(system_memory.available / 1024 / 1024 / 1024, 2),
            "system_memory_used_percent": round(system_memory.percent, 2),
            # Legacy fields for backward compatibility
            "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
            "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
            "percent": round(memory_percent, 2),
            "available_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2)
        }
    except Exception as e:
        logger.error(f"Error getting memory usage: {e}")
        return {
            "process_memory_mb": 0,
            "process_memory_percent": 0,
            "process_cpu_percent": 0,
            "system_memory_total_gb": 0,
            "system_memory_available_gb": 0,
            "system_memory_used_percent": 0,
            "rss_mb": 0,
            "vms_mb": 0,
            "percent": 0,
            "available_mb": 0,
            "error": str(e)
        }

def load_model():
    """Load the Llama 3.2 GGUF model using llama-cpp-python"""
    global llm, status_reporter, title_generator
    
    try:
        # Send loading status
        if status_reporter:
            status_reporter.send_loading_status("Loading Llama 3.2 model")
        
        logger.info(f"Loading Llama 3.2 model from: {MODEL_PATH}")
        logger.info(f"Context window: {N_CTX}, Threads: {N_THREADS}, GPU layers: {N_GPU_LAYERS}")
        
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            error_msg = f"Model file not found: {MODEL_PATH}"
            if status_reporter:
                status_reporter.send_error_status(error_msg)
            raise FileNotFoundError(error_msg)
        
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
        
        # Initialize title generator
        title_generator = create_title_generator(llm)
        
        logger.info("Llama 3.2 model loaded successfully")
        logger.info(f"Memory usage after loading: {get_memory_usage()}")
        
        # Send healthy status
        if status_reporter:
            status_reporter.send_healthy_status("Llama-3.2-1B-Instruct")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        if status_reporter:
            status_reporter.send_error_status(str(e))
        raise e

def cleanup_model():
    """Clean up model resources"""
    global llm, title_generator
    
    if llm is not None:
        del llm
        llm = None
    
    if title_generator is not None:
        del title_generator
        title_generator = None
    
    # Force garbage collection
    gc.collect()
    
    logger.info("Model cleanup completed")

def get_current_status():
    """Get current service status for periodic reporting"""
    global llm
    
    model_loaded = llm is not None
    
    if model_loaded:
        return {
            'status': 'healthy',
            'ready': True,
            'message': 'Service is running normally',
            'model': 'Llama-3.2-1B-Instruct',
            'model_loaded': True,
            'model_loading': False
        }
    else:
        return {
            'status': 'error',
            'ready': False,
            'message': 'Model not loaded',
            'model': 'Llama-3.2-1B-Instruct',
            'model_loaded': False,
            'model_loading': False
        }

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    global status_reporter
    
    # Startup
    logger.info("Starting lightweight LLM service...")
    
    # Initialize status reporter
    status_reporter = StatusReporter(SERVICE_NAME, CONVEX_URL)
    status_reporter.send_startup_status()
    
    try:
        load_model()
        
        # Start periodic status reporting every 30 seconds
        status_reporter.start_periodic_reporting(interval_seconds=30, get_status_callback=get_current_status)
        logger.info("Periodic status reporting started")
        
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        if status_reporter:
            status_reporter.send_error_status(str(e))
        raise
    
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

# Import the RAG processors
from rag_processor import process_rag_query

# Import conversation title generator
from conversation_title import create_title_generator

# Try to import LangExtract RAG processor, fall back gracefully if not available
try:
    from langextract_rag import enhanced_process_rag_query, get_langextract_processor
    LANGEXTRACT_RAG_AVAILABLE = True
    logger.info("LangExtract RAG processor imported successfully")
except ImportError as e:
    logger.warning(f"LangExtract RAG processor not available: {e}")
    LANGEXTRACT_RAG_AVAILABLE = False
    
    # Create fallback functions
    def enhanced_process_rag_query(message: str, context: str):
        """Fallback function when LangExtract is not available"""
        enhanced_message, system_msg = process_rag_query(message, context)
        metadata = {
            "classification": {"query_type": "fallback", "confidence": 0.5},
            "langextract_available": False,
            "fallback_reason": "LangExtract not available"
        }
        return enhanced_message, system_msg, metadata
    
    def get_langextract_processor():
        """Fallback function when LangExtract is not available"""
        class FallbackClassification:
            def __init__(self, query_type="general", confidence=0.5, key_entities=None, 
                        expected_answer_type="general_response", extraction_focus=None):
                self.query_type = query_type
                self.confidence = confidence
                self.key_entities = key_entities or []
                self.expected_answer_type = expected_answer_type
                self.extraction_focus = extraction_focus or []
        
        class FallbackProcessor:
            def __init__(self):
                self.extractor = None
                self.model_name = "fallback"
            
            def classify_query(self, query: str):
                return FallbackClassification()
        
        return FallbackProcessor()

def format_chat_prompt(message: str, context: str = "", conversation_history: List[Dict[str, str]] = None) -> tuple:
    """Format the chat prompt for Llama-3.2 with proper chat template and RAG support
    
    Returns:
        tuple: (prompt, rag_metadata)
    """
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
        
        # Process the query using our enhanced LangExtract RAG processor
        rag_metadata = None
        try:
            # First try the enhanced LangExtract processor
            enhanced_message, system_msg, rag_metadata = enhanced_process_rag_query(message, truncated_context)
            
            # Log the enhanced classification results
            classification = rag_metadata.get("classification", {})
            query_type = classification.get("query_type", "unknown")
            confidence = classification.get("confidence", 0.0)
            
            logger.info(f"LangExtract classification: {query_type} (confidence: {confidence:.2f})")
            
            if rag_metadata.get("extracted_entities"):
                logger.info(f"Extracted {len(rag_metadata['extracted_entities'])} relevant entities")
            
            if not rag_metadata.get("langextract_available", False):
                logger.info("LangExtract not available, using fallback classification")
                
        except Exception as e:
            # If there's any error in the enhanced processor, fall back to the original
            logger.error(f"Error in enhanced RAG processor: {e}. Falling back to original processor.")
            try:
                enhanced_message, system_msg = process_rag_query(message, truncated_context)
                logger.info("Using original RAG processor")
                # Create basic metadata for fallback
                rag_metadata = {
                    "classification": {"query_type": "fallback", "confidence": 0.5},
                    "langextract_available": False,
                    "fallback_used": True
                }
            except Exception as e2:
                logger.error(f"Error in original RAG processor: {e2}. Using default prompt.")
                system_msg = (
                    "You are a helpful AI assistant. Answer questions based on the provided document information. "
                    "Be concise and accurate. Pay attention to all details in the document, including any specific "
                    "numbers, dates, or values that might be relevant to the query.\n\n"
                    f"Document Information:\n{truncated_context}"
                )
                rag_metadata = {
                    "classification": {"query_type": "default", "confidence": 0.3},
                    "langextract_available": False,
                    "error": "Both enhanced and original processors failed"
                }
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
    
    # Return both prompt and metadata
    return prompt, locals().get('rag_metadata', None)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    global status_reporter
    
    model_loaded = llm is not None
    memory_usage = get_memory_usage()
    
    # Send status update to Convex
    if status_reporter:
        if model_loaded:
            status_reporter.send_healthy_status("Llama-3.2-1B-Instruct")
        else:
            status_reporter.send_error_status("Model not loaded")
    
    return HealthResponse(
        status="healthy" if model_loaded else "error",
        model_loaded=model_loaded,
        memory_usage=memory_usage,
        model_path=MODEL_PATH
    )

# Helper function for general text processing
def process_text(text: str) -> str:
    """Process text for better formatting"""
    # Remove excessive whitespace
    processed = re.sub(r'\s+', ' ', text).strip()
    return processed

# Check if RAG modules are available
def check_rag_modules():
    """Check if the RAG modules are available and load them if needed"""
    modules = ['quantitative_rag', 'qualitative_rag', 'rag_processor']
    missing = []
    
    for module in modules:
        if importlib.util.find_spec(module) is None:
            missing.append(module)
    
    if missing:
        logger.warning(f"Missing RAG modules: {', '.join(missing)}. Some RAG features may not be available.")
        return False
    
    return True

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate a chat response using Llama 3.2 via llama-cpp"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Check if RAG modules are available
        has_rag_modules = check_rag_modules()
        if not has_rag_modules:
            logger.warning("RAG modules not available. Using default prompt formatting.")
        
        # Format the prompt and get RAG metadata
        prompt, rag_metadata = format_chat_prompt(
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
        
        # Generate conversation title if this is a new conversation
        generated_title = None
        if request.is_new_conversation and title_generator:
            try:
                logger.info("Generating conversation title...")
                title_start_time = time.time()
                generated_title = title_generator.generate_title(request.message, generated_text)
                title_generation_time = time.time() - title_start_time
                logger.info(f"Title generated successfully in {title_generation_time:.2f}s: {generated_title}")
                

            except Exception as e:
                logger.error(f"Error generating conversation title: {str(e)}")
                generated_title = None
        
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
            },
            rag_metadata=rag_metadata,
            generated_title=generated_title
        )
        
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Check LangExtract availability
    try:
        processor = get_langextract_processor()
        langextract_status = {
            "available": LANGEXTRACT_RAG_AVAILABLE and processor.extractor is not None,
            "model": processor.model_name if processor.extractor else None,
            "import_available": LANGEXTRACT_RAG_AVAILABLE
        }
    except Exception as e:
        logger.error(f"Error checking LangExtract status: {e}")
        langextract_status = {
            "available": False,
            "model": None,
            "import_available": False,
            "error": str(e)
        }
    
    return {
        "model_name": "Llama-3.2-1B-Instruct",
        "model_path": MODEL_PATH,
        "context_window": N_CTX,
        "threads": N_THREADS,
        "gpu_layers": N_GPU_LAYERS,
        "memory_usage": get_memory_usage(),
        "model_exists": os.path.exists(MODEL_PATH),
        "langextract": langextract_status
    }

class QueryClassificationRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    query: str

class QueryClassificationResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    query_type: str
    confidence: float
    key_entities: List[str]
    expected_answer_type: str
    extraction_focus: List[str]
    langextract_available: bool

@app.post("/classify-query", response_model=QueryClassificationResponse)
async def classify_query(request: QueryClassificationRequest):
    """Classify a query to understand its type and requirements"""
    try:
        processor = get_langextract_processor()
        classification = processor.classify_query(request.query)
        
        return QueryClassificationResponse(
            query_type=classification.query_type,
            confidence=classification.confidence,
            key_entities=classification.key_entities,
            expected_answer_type=classification.expected_answer_type,
            extraction_focus=classification.extraction_focus,
            langextract_available=LANGEXTRACT_RAG_AVAILABLE and processor.extractor is not None
        )
        
    except Exception as e:
        logger.error(f"Error classifying query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to classify query: {str(e)}")

def install_langextract_if_requested():
    """Install LangExtract if requested via environment variable"""
    install_langextract = os.getenv("INSTALL_LANGEXTRACT", "false").lower() == "true"
    
    if install_langextract:
        logger.info("Installing LangExtract as requested...")
        try:
            import subprocess
            import sys
            subprocess.check_call([sys.executable, "-m", "pip", "install", "langextract"])
            logger.info("LangExtract installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install LangExtract: {e}")
            logger.info("Continuing without LangExtract...")
            return False
    else:
        logger.info("LangExtract installation not requested (set INSTALL_LANGEXTRACT=true to enable)")
        return False

if __name__ == "__main__":
    import uvicorn
    
    # Check if we're running in Docker and install LangExtract if requested
    if os.getenv("DOCKER_CONTAINER", "false").lower() == "true" or os.path.exists("/.dockerenv"):
        logger.info("Running in Docker container")
        langextract_installed = install_langextract_if_requested()
        if langextract_installed:
            logger.info("LangExtract is available - enhanced RAG processing enabled")
        else:
            logger.info("LangExtract not available - using fallback RAG processing")
    
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
