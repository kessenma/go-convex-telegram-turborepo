import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psutil
import time

from config import Config
from model_manager import ModelManager
from chat_handler import ChatHandler
from status_reporter import StatusReporter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
config = None
model_manager = None
chat_handler = None
status_reporter = None

class ChatRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    message: str
    context: str = ""
    conversation_history: List[Dict[str, str]] = []
    max_length: Optional[int] = 512
    temperature: Optional[float] = 0.7
    conversation_id: Optional[str] = None
    is_new_conversation: Optional[bool] = False
    model: Optional[str] = None

class ChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    response: str
    model_info: Dict[str, Any]
    usage: Dict[str, Any]
    rag_metadata: Optional[Dict[str, Any]] = None
    generated_title: Optional[str] = None

class SwitchReq(BaseModel):
    model_id: str

class SetDefaultModelReq(BaseModel):
    model_id: str

class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    memory_usage: Dict[str, Any]
    model_path: str

async def load_default_model_background():
    """Load the default model in background after startup"""
    try:
        # Wait a bit for the app to fully start
        await asyncio.sleep(2)
        
        default_model = config.get_default_model_config()
        if default_model and model_manager:
            logger.info(f"Starting background loading of default model: {default_model.name}")
            success = model_manager.load_model(default_model.name)
            if success:
                logger.info(f"Successfully loaded default model: {default_model.name}")
            else:
                logger.warning(f"Failed to load default model: {default_model.name}")
    except Exception as e:
        logger.error(f"Error loading default model in background: {e}")

def get_memory_usage():
    """Get current memory usage statistics"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        
        # Get system memory info
        system_memory = psutil.virtual_memory()
        
        return {
            "process_memory_mb": round(memory_info.rss / 1024 / 1024, 2),
            "process_memory_percent": round(memory_percent, 2),
            "system_memory_total_gb": round(system_memory.total / 1024 / 1024 / 1024, 2),
            "system_memory_available_gb": round(system_memory.available / 1024 / 1024 / 1024, 2),
            "system_memory_percent": round(system_memory.percent, 2)
        }
    except Exception as e:
        logger.error(f"Error getting memory usage: {e}")
        return {
            "process_memory_mb": 0,
            "process_memory_percent": 0,
            "system_memory_total_gb": 0,
            "system_memory_available_gb": 0,
            "system_memory_percent": 0
        }

def initialize_services():
    """Initialize all services"""
    global config, model_manager, chat_handler, status_reporter
    
    try:
        # Initialize configuration
        config = Config()
        logger.info("Configuration loaded successfully")
        
        # Initialize model manager
        model_manager = ModelManager()
        logger.info("Model manager initialized")
        
        # Load default model in background after startup
        default_model = config.get_default_model_config()
        if default_model:
            logger.info(f"Default model '{default_model.name}' will be loaded in background")
            # Start background task to load default model
            asyncio.create_task(load_default_model_background())
        else:
            logger.info("No default model configured")
        
        # Initialize chat handler
        chat_handler = ChatHandler(model_manager)
        logger.info("Chat handler initialized")
        
        # Initialize status reporter
        status_reporter = StatusReporter(
            service_name=config.service_name,
            convex_url=config.convex_url
        )
        logger.info("Status reporter initialized")
        
        return True
        
    except Exception as e:
        logger.error(f"Error initializing services: {str(e)}")
        return False

def cleanup_services():
    """Clean up all services"""
    global model_manager, chat_handler, status_reporter
    
    try:
        if model_manager:
            logger.info("Cleaning up model manager...")
            model_manager.cleanup()
            model_manager = None
            
        if chat_handler:
            chat_handler = None
            
        if status_reporter:
            status_reporter = None
            
        logger.info("Services cleanup completed")
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")

def get_current_status():
    """Get current service status"""
    try:
        memory_usage = get_memory_usage()
        
        if model_manager and model_manager.current_model:
            return {
                "status": "healthy",
                "model_loaded": True,
                "current_model": model_manager.current_model,
                "available_models": model_manager.get_available_models(),
                "memory_usage": memory_usage,
                "timestamp": time.time()
            }
        else:
            return {
                "status": "error",
                "model_loaded": False,
                "current_model": None,
                "available_models": [],
                "memory_usage": memory_usage,
                "timestamp": time.time()
            }
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return {
            "status": "error",
            "model_loaded": False,
            "current_model": None,
            "available_models": [],
            "memory_usage": {},
            "timestamp": time.time(),
            "error": str(e)
        }

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting Lightweight LLM Service...")
    
    try:
        # Initialize all services
        success = initialize_services()
        if not success:
            raise Exception("Failed to initialize services")
        
        logger.info("Service startup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down Lightweight LLM Service...")
    cleanup_services()

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

# New endpoints for model management
@app.get("/models")
async def list_models():
    """List available models and current model"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        available_models = model_manager.get_available_models()
        current_model = model_manager.current_model
        
        return {
            "available_models": available_models,
            "current_model": current_model
        }
    except Exception as e:
        logger.error(f"Error in /models endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving models: {str(e)}")

@app.post("/models/{model_name}/load")
async def load_model_endpoint(model_name: str):
    """Load a specific model"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        success = model_manager.load_model(model_name)
        if success:
            return {"message": f"Model '{model_name}' loaded successfully", "current_model": model_manager.current_model}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to load model '{model_name}'")
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@app.post("/models/unload")
async def unload_model_endpoint():
    """Unload the current model"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        model_manager.unload_current_model()
        return {"message": "Model unloaded successfully", "current_model": None}
    except Exception as e:
        logger.error(f"Error unloading model: {e}")
        raise HTTPException(status_code=500, detail=f"Error unloading model: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate chat response with RAG support"""
    if not model_manager or not chat_handler:
        raise HTTPException(status_code=503, detail="Services not initialized")
    
    # Handle model switching if requested
    if request.model:
        current_model_name = model_manager.current_model if model_manager.current_model else None
        if current_model_name != request.model:
            logger.info(f"Switching from {current_model_name} to {request.model}")
            try:
                success = model_manager.load_model(request.model)
                if not success:
                    raise Exception("Load returned False")
                logger.info(f"Successfully loaded model: {request.model}")
            except Exception as e:
                logger.error(f"Failed to load model {request.model}: {e}")
                raise HTTPException(status_code=503, detail=f"Failed to load model {request.model}: {str(e)}")
    
    
    try:
        response = await chat_handler.process_message(
            message=request.message,
            context=request.context,
            conversation_history=request.conversation_history,
            max_length=request.max_length,
            temperature=request.temperature,
            conversation_id=request.conversation_id,
            is_new_conversation=request.is_new_conversation
        )
        return response
        
    except Exception as e:
        logger.error(f"Error processing chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        memory_usage = get_memory_usage()
        model_loaded = model_manager is not None and model_manager.current_model is not None
        
        return HealthResponse(
            status="healthy" if model_loaded else "unhealthy",
            model_loaded=model_loaded,
            memory_usage=memory_usage,
            model_path=config.get_model_config(model_manager.current_model).model_path if model_loaded and model_manager.current_model and config else "N/A"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")



# Model info endpoint
@app.get("/model-info")
async def get_model_info():
    """Get information about the current model and system"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        current_model_info = None
        if model_manager.current_model:
            current_model_config = config.get_model_config(model_manager.current_model)
            if current_model_config:
                current_model_info = {
                    "name": current_model_config.name,
                    "provider": current_model_config.provider.value,
                    "model_path": current_model_config.model_path,
                    "context_window": current_model_config.context_window,
                    "threads": current_model_config.threads,
                    "gpu_layers": current_model_config.gpu_layers
                }
        
        return {
            "current_model": current_model_info,
            "available_models": model_manager.get_available_models(),
            "memory_usage": get_memory_usage(),
            "system_info": {
                "service_name": config.service_name,
                "convex_url": config.convex_url
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@app.get("/models/status")
async def get_models_status():
    """Get status and download progress for all models"""
    try:
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        models_status = {}
        
        # Get all configured models
        for model_name in config.models.keys():
            model_config = config.get_model_config(model_name)
            status = model_manager.get_model_status(model_name)
            progress = model_manager.get_download_progress(model_name)
            is_loaded = model_manager.is_model_loaded(model_name)
            download_status = model_manager.get_download_status(model_name)
            download_details = model_manager.get_download_details(model_name)
            is_downloading = model_manager.is_downloading(model_name)
            
            models_status[model_name] = {
                "name": model_name,
                "display_name": model_config.display_name if model_config else model_name,
                "provider": model_config.provider.value if model_config else "unknown",
                "status": status,
                "download_progress": progress,
                "download_status": download_status,
                "download_details": download_details,
                "is_downloading": is_downloading,
                "is_loaded": is_loaded,
                "is_current": model_manager.current_model == model_name,
                "priority": model_config.priority if model_config else 0,
                "auto_download": model_config.auto_download if model_config else False
            }
        
        return {
            "models": models_status,
            "current_model": model_manager.current_model,
            "timestamp": time.time()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting models status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting models status: {str(e)}")

@app.post("/admin/switch")
async def switch_model(req: SwitchReq):
    """Switch to a different model at runtime"""
    try:
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Check if model is available in config
        if not config.is_model_available(req.model_id):
            raise HTTPException(status_code=400, detail=f"Model {req.model_id} not available in configuration")
        
        # Attempt to switch to the new model
        success = await model_manager.switch_to(req.model_id)
        
        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to load model {req.model_id}")
        
        return {
            "ok": True, 
            "current_model": req.model_id,
            "message": f"Successfully switched to {req.model_id}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error switching model: {e}")
        raise HTTPException(status_code=500, detail=f"Error switching model: {str(e)}")

@app.post("/admin/set-default")
async def set_default_model(req: SetDefaultModelReq):
    """Set the default model for the application"""
    try:
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Check if model is available in config
        if not config.is_model_available(req.model_id):
            raise HTTPException(status_code=400, detail=f"Model {req.model_id} not available in configuration")
        
        # Update the default model in config
        config.default_model = req.model_id
        
        # Switch to the new default model
        success = await model_manager.switch_to(req.model_id)
        
        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to load default model {req.model_id}")
        
        return {
            "ok": True,
            "default_model": req.model_id,
            "message": f"Successfully set {req.model_id} as default model"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting default model: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting default model: {str(e)}")

@app.get("/admin/default-model")
async def get_default_model():
    """Get the current default model"""
    try:
        return {
            "ok": True,
            "default_model": config.default_model,
            "current_model": model_manager.get_current_model() if model_manager else None
        }
    except Exception as e:
        logger.error(f"Error getting default model: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting default model: {str(e)}")

if __name__ == "__main__":
    # Start the server
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
