import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

class ModelProvider(Enum):
    """Supported LLM providers"""
    LLAMA_CPP = "llama_cpp"
    OLLAMA = "ollama"
    OPENAI_COMPATIBLE = "openai_compatible"
    HUGGINGFACE = "huggingface"

@dataclass
class ModelConfig:
    """Configuration for a specific model"""
    name: str
    provider: ModelProvider
    model_path: str
    display_name: str
    description: str
    max_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    context_window: int = 4096
    threads: int = 8
    gpu_layers: int = 0
    batch_size: int = 256
    use_mmap: bool = True
    use_mlock: bool = False
    f16_kv: bool = True
    # Priority loading settings
    priority: int = 0  # Lower numbers = higher priority
    auto_download: bool = False
    download_after: Optional[str] = None  # Model name to wait for before downloading
    # Provider-specific settings
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    model_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "name": self.name,
            "provider": self.provider.value,
            "display_name": self.display_name,
            "description": self.description,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "context_window": self.context_window
        }

class Config:
    """Application configuration"""
    
    def __init__(self):
        # Service configuration
        self.service_name = "lightweight-llm"
        self.port = int(os.getenv("PORT", "8082"))
        self.convex_url = os.getenv("CONVEX_URL", "http://localhost:3211")
        self.docker_container = os.getenv("DOCKER_CONTAINER", "false").lower() == "true"
        
        # Performance settings
        self._setup_performance_env()
        
        # Model directories
        self.models_dir = os.getenv("MODELS_DIR", "/models")
        self.hf_cache_dir = os.getenv("HF_CACHE_DIR", "/root/.cache/huggingface")
        
        # Model configurations
        self.models = self._load_model_configs()
        
        # Default model
        self.default_model = os.getenv("DEFAULT_MODEL", "meta-llama/Llama-3.2-1B-Instruct")
        
        # Status reporting
        self.status_report_interval = int(os.getenv("STATUS_REPORT_INTERVAL", "30"))
        
    def _setup_performance_env(self):
        """Set up environment variables for optimal CPU performance"""
        performance_vars = {
            "OMP_NUM_THREADS": "8",
            "MKL_NUM_THREADS": "8",
            "OPENBLAS_NUM_THREADS": "8",
            "NUMEXPR_NUM_THREADS": "8",
            "VECLIB_MAXIMUM_THREADS": "8"
        }
        
        for var, value in performance_vars.items():
            if var not in os.environ:
                os.environ[var] = value
    
    def _load_model_configs(self) -> Dict[str, ModelConfig]:
        """Load model configurations for runtime model loading"""
        models = {}
        
        # Common HuggingFace models that can be loaded at runtime
        hf_models = {
            "meta-llama/Llama-3.2-1B-Instruct": {
                "display_name": "Llama 3.2 1B Instruct",
                "description": "Fast and efficient 1B parameter model for quick responses",
                "max_tokens": 512,
                "context_window": 4096
            },
            "meta-llama/Llama-3.2-3B-Instruct": {
                "display_name": "Llama 3.2 3B Instruct",
                "description": "Balanced 3B parameter model with better reasoning capabilities",
                "max_tokens": 1024,
                "context_window": 8192
            },
            "microsoft/DialoGPT-medium": {
                "display_name": "DialoGPT Medium",
                "description": "Microsoft's conversational AI model",
                "max_tokens": 512,
                "context_window": 1024
            },
            "google/flan-t5-base": {
                "display_name": "FLAN-T5 Base",
                "description": "Google's instruction-tuned T5 model",
                "max_tokens": 512,
                "context_window": 512
            },
            "google/medgemma-4b-it": {
                "display_name": "MedGemma 4B Instruct",
                "description": "Google's medical AI model for healthcare applications",
                "max_tokens": 1024,
                "context_window": 8192
            }
        }
        
        # Create model configs for HuggingFace models
        for model_id, config_data in hf_models.items():
            models[model_id] = ModelConfig(
                name=model_id,
                provider=ModelProvider.HUGGINGFACE,
                model_path=model_id,  # HuggingFace model ID
                display_name=config_data["display_name"],
                description=config_data["description"],
                max_tokens=config_data["max_tokens"],
                temperature=0.7,
                context_window=config_data["context_window"],
                threads=int(os.getenv("N_THREADS", "8")),
                gpu_layers=int(os.getenv("N_GPU_LAYERS", "0")),
                model_id=model_id
            )
        
        return models
    
    def get_model_config(self, model_name: str) -> Optional[ModelConfig]:
        """Get configuration for a specific model"""
        return self.models.get(model_name)
    
    def get_default_model_config(self) -> ModelConfig:
        """Get the default model configuration"""
        return self.models[self.default_model]
    
    def list_available_models(self) -> Dict[str, Dict[str, Any]]:
        """List all available models"""
        return {name: config.to_dict() for name, config in self.models.items()}
    
    def is_model_available(self, model_name: str) -> bool:
        """Check if a model is available"""
        if model_name not in self.models:
            return False
        
        config = self.models[model_name]
        
        # For local models, check if file exists
        if config.provider == ModelProvider.LLAMA_CPP:
            return os.path.exists(config.model_path)
        
        # For API-based models, assume available if configured
        return True
    
    def get_models_by_priority(self) -> list[ModelConfig]:
        """Get models sorted by priority (lower numbers first)"""
        return sorted(self.models.values(), key=lambda m: m.priority)
    
    def get_auto_download_models(self) -> list[ModelConfig]:
        """Get models that should be auto-downloaded"""
        return [model for model in self.models.values() if model.auto_download]
    
    def get_models_waiting_for(self, model_name: str) -> list[ModelConfig]:
        """Get models that are waiting for the specified model to be ready"""
        return [model for model in self.models.values() if model.download_after == model_name]

# Global configuration instance
config = Config()