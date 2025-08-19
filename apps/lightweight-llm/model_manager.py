import os
import logging
import threading
import time
import gc
import asyncio
from typing import Optional, Dict, Any, List, Generator
from abc import ABC, abstractmethod
from config import ModelConfig, ModelProvider, config

logger = logging.getLogger(__name__)

class BaseModelProvider(ABC):
    """Abstract base class for model providers"""
    
    def __init__(self, model_config: ModelConfig):
        self.config = model_config
        self.model = None
        self.is_loaded = False
    
    @abstractmethod
    def load_model(self) -> bool:
        """Load the model. Returns True if successful."""
        pass
    
    @abstractmethod
    def unload_model(self):
        """Unload the model to free memory"""
        pass
    
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Generate text from the model. Yields tokens as they're generated."""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the model is available for use"""
        pass

class LlamaCppProvider(BaseModelProvider):
    """Provider for llama-cpp-python models"""
    
    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self.llama = None
    
    def load_model(self) -> bool:
        """Load the llama.cpp model"""
        try:
            from llama_cpp import Llama
            
            logger.info(f"Loading {self.config.name} from {self.config.model_path}")
            
            self.llama = Llama(
                model_path=self.config.model_path,
                n_ctx=self.config.context_window,
                n_threads=self.config.threads,
                n_gpu_layers=self.config.gpu_layers,
                n_batch=self.config.batch_size,
                use_mmap=self.config.use_mmap,
                use_mlock=self.config.use_mlock,
                f16_kv=self.config.f16_kv,
                verbose=False
            )
            
            self.model = self.llama
            self.is_loaded = True
            logger.info(f"Successfully loaded {self.config.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.config.name}: {e}")
            self.is_loaded = False
            return False
    
    def unload_model(self):
        """Unload the model with proper cleanup"""
        if self.llama:
            # Clear references
            del self.llama
            self.llama = None
            self.model = None
            self.is_loaded = False
            
            # Force garbage collection
            gc.collect()
            logger.info(f"Unloaded {self.config.name} with memory cleanup")
    
    def generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Generate text using llama.cpp"""
        if not self.is_loaded or not self.llama:
            raise RuntimeError(f"Model {self.config.name} is not loaded")
        
        # Extract generation parameters
        max_tokens = kwargs.get('max_tokens', self.config.max_tokens)
        temperature = kwargs.get('temperature', self.config.temperature)
        top_p = kwargs.get('top_p', self.config.top_p)
        stream = kwargs.get('stream', True)
        
        try:
            response = self.llama(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                stream=stream,
                stop=["<|eot_id|>", "<|end_of_text|>", "</s>"],
                echo=False
            )
            
            if stream:
                for chunk in response:
                    if 'choices' in chunk and len(chunk['choices']) > 0:
                        delta = chunk['choices'][0].get('delta', {})
                        if 'content' in delta:
                            yield delta['content']
            else:
                if 'choices' in response and len(response['choices']) > 0:
                    yield response['choices'][0]['text']
                    
        except Exception as e:
            logger.error(f"Error generating with {self.config.name}: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if the model file exists"""
        return os.path.exists(self.config.model_path)

class OllamaProvider(BaseModelProvider):
    """Provider for Ollama models"""
    
    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self.client = None
    
    def load_model(self) -> bool:
        """Initialize Ollama client"""
        try:
            import requests
            
            # Test connection to Ollama
            response = requests.get(f"{self.config.api_base}/api/tags", timeout=5)
            if response.status_code == 200:
                self.is_loaded = True
                logger.info(f"Connected to Ollama at {self.config.api_base}")
                return True
            else:
                logger.error(f"Failed to connect to Ollama: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return False
    
    def unload_model(self):
        """No need to unload for API-based models"""
        self.is_loaded = False
    
    def generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Generate text using Ollama API"""
        if not self.is_loaded:
            raise RuntimeError(f"Ollama provider is not connected")
        
        try:
            import requests
            import json
            
            data = {
                "model": self.config.model_path,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": kwargs.get('temperature', self.config.temperature),
                    "top_p": kwargs.get('top_p', self.config.top_p),
                    "num_predict": kwargs.get('max_tokens', self.config.max_tokens)
                }
            }
            
            response = requests.post(
                f"{self.config.api_base}/api/generate",
                json=data,
                stream=True,
                timeout=60
            )
            
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line.decode('utf-8'))
                    if 'response' in chunk:
                        yield chunk['response']
                    if chunk.get('done', False):
                        break
                        
        except Exception as e:
            logger.error(f"Error generating with Ollama: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if Ollama service is available"""
        try:
            import requests
            response = requests.get(f"{self.config.api_base}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

class OpenAICompatibleProvider(BaseModelProvider):
    """Provider for OpenAI-compatible APIs"""
    
    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self.client = None
    
    def load_model(self) -> bool:
        """Initialize OpenAI-compatible client"""
        try:
            from openai import OpenAI
            
            self.client = OpenAI(
                base_url=self.config.api_base,
                api_key=self.config.api_key or "dummy-key"
            )
            
            # Test connection
            models = self.client.models.list()
            self.is_loaded = True
            logger.info(f"Connected to OpenAI-compatible API at {self.config.api_base}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI-compatible API: {e}")
            return False
    
    def unload_model(self):
        """No need to unload for API-based models"""
        self.client = None
        self.is_loaded = False
    
    def generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Generate text using OpenAI-compatible API"""
        if not self.is_loaded or not self.client:
            raise RuntimeError(f"OpenAI-compatible provider is not connected")
        
        try:
            response = self.client.chat.completions.create(
                model=self.config.model_path,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get('max_tokens', self.config.max_tokens),
                temperature=kwargs.get('temperature', self.config.temperature),
                top_p=kwargs.get('top_p', self.config.top_p),
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Error generating with OpenAI-compatible API: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if API is available"""
        return self.config.api_base is not None

class HuggingFaceProvider(BaseModelProvider):
    """Provider for HuggingFace models using transformers library"""
    
    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self.tokenizer = None
        self.model = None
        self.download_progress = 0.0
        self.is_downloading = False
        self.download_status = "ready"  # ready, downloading, loading, complete, error
        self.download_details = {}  # Store detailed download info
    
    def load_model(self) -> bool:
        """Load the HuggingFace model with progress tracking"""
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch
            
            logger.info(f"Starting download/load of HuggingFace model: {self.config.model_path}")
            self.download_status = "downloading"
            self.is_downloading = True
            self.download_progress = 0.0
            
            # Load tokenizer with progress tracking
            logger.info(f"Downloading tokenizer for {self.config.model_path}...")
            self.download_details["current_step"] = "tokenizer"
            self.download_progress = 10.0
            
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.config.model_path,
                trust_remote_code=True
            )
            
            logger.info(f"Tokenizer downloaded successfully for {self.config.model_path}")
            self.download_progress = 30.0
            
            # Load model with appropriate settings
            logger.info(f"Downloading model weights for {self.config.model_path}...")
            self.download_details["current_step"] = "model_weights"
            self.download_progress = 40.0
            
            device_map = "auto" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.model_path,
                torch_dtype=torch_dtype,
                device_map=device_map,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            logger.info(f"Model weights downloaded successfully for {self.config.model_path}")
            self.download_progress = 80.0
            
            # Set pad token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.download_status = "complete"
            self.download_details["current_step"] = "complete"
            self.is_loaded = True
            self.is_downloading = False
            self.download_progress = 100.0
            
            logger.info(f"Successfully loaded HuggingFace model: {self.config.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading HuggingFace model {self.config.model_path}: {e}")
            self.download_status = "error"
            self.download_details["error"] = str(e)
            self.is_loaded = False
            self.is_downloading = False
            return False
    
    def unload_model(self):
        """Unload the HuggingFace model"""
        if self.model:
            del self.model
            self.model = None
        if self.tokenizer:
            del self.tokenizer
            self.tokenizer = None
        self.is_loaded = False
        logger.info(f"Unloaded HuggingFace model {self.config.name}")
    
    def generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Generate text using the HuggingFace model"""
        if not self.is_loaded or not self.model or not self.tokenizer:
            raise RuntimeError(f"HuggingFace model {self.config.name} is not loaded")
        
        try:
            import torch
            
            # Tokenize input
            inputs = self.tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Generate with streaming
            max_new_tokens = kwargs.get('max_tokens', self.config.max_tokens)
            temperature = kwargs.get('temperature', self.config.temperature)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode and yield the generated text
            generated_text = self.tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:], 
                skip_special_tokens=True
            )
            
            yield generated_text
            
        except Exception as e:
            logger.error(f"Error generating with HuggingFace model: {e}")
            yield f"Error: {str(e)}"
    
    def is_available(self) -> bool:
        """Check if HuggingFace transformers is available"""
        try:
            import transformers
            return True
        except ImportError:
            return False
    
    def get_download_progress(self) -> float:
        """Get download progress percentage"""
        return self.download_progress

class ModelManager:
    """Manages multiple model providers"""
    
    def __init__(self):
        self.providers: Dict[str, BaseModelProvider] = {}
        self.current_model: Optional[str] = None
        self.loading_queue: List[str] = []
        self.download_threads: Dict[str, threading.Thread] = {}
        self.model_status: Dict[str, str] = {}  # 'ready', 'loading', 'downloading', 'error'
        self._switching_lock = asyncio.Lock()
        self._is_switching = False
        self._initialize_providers()
        # Do not auto-load models on import/init to avoid blocking startup
        # Sequential loading can be started explicitly after app startup if desired
        # self._start_sequential_loading()
    
    def _initialize_providers(self):
        """Initialize all available model providers"""
        for model_name, model_config in config.models.items():
            if model_config.provider == ModelProvider.LLAMA_CPP:
                self.providers[model_name] = LlamaCppProvider(model_config)
            elif model_config.provider == ModelProvider.OLLAMA:
                self.providers[model_name] = OllamaProvider(model_config)
            elif model_config.provider == ModelProvider.OPENAI_COMPATIBLE:
                self.providers[model_name] = OpenAICompatibleProvider(model_config)
            elif model_config.provider == ModelProvider.HUGGINGFACE:
                self.providers[model_name] = HuggingFaceProvider(model_config)
            
            # Initialize model status
            self.model_status[model_name] = 'ready'
    
    def _start_sequential_loading(self):
        """Start sequential loading of models based on priority"""
        # Get models sorted by priority
        priority_models = config.get_models_by_priority()
        
        # Start with the highest priority model
        if priority_models:
            first_model = priority_models[0]
            self._load_model_async(first_model.name)
    
    def _load_model_async(self, model_name: str):
        """Load a model asynchronously"""
        if model_name not in self.providers:
            logger.error(f"Model {model_name} not found")
            return
        
        self.model_status[model_name] = 'loading'
        
        def load_worker():
            try:
                success = self.load_model(model_name)
                if success:
                    self.model_status[model_name] = 'ready'
                    # Trigger next model in sequence
                    self._trigger_next_model(model_name)
                else:
                    self.model_status[model_name] = 'error'
            except Exception as e:
                logger.error(f"Error loading model {model_name}: {e}")
                self.model_status[model_name] = 'error'
        
        thread = threading.Thread(target=load_worker, daemon=True)
        self.download_threads[model_name] = thread
        thread.start()
    
    def _trigger_next_model(self, completed_model: str):
        """Trigger loading of models that depend on the completed model"""
        waiting_models = config.get_models_waiting_for(completed_model)
        
        for model_config in waiting_models:
            if (model_config.auto_download and 
                self.model_status.get(model_config.name) == 'ready' and
                not self.is_model_loaded(model_config.name)):
                
                logger.info(f"Starting download of {model_config.name} after {completed_model} completed")
                self._load_model_async(model_config.name)
    
    def get_model_status(self, model_name: str) -> str:
        """Get the current status of a model"""
        return self.model_status.get(model_name, 'unknown')
    
    def get_download_progress(self, model_name: str) -> float:
        """Get download progress for a model"""
        if model_name in self.providers:
            provider = self.providers[model_name]
            if hasattr(provider, 'get_download_progress'):
                return provider.get_download_progress()
        return 0.0
    
    def get_download_status(self, model_name: str) -> str:
        """Get download status for a model"""
        if model_name in self.providers:
            provider = self.providers[model_name]
            if hasattr(provider, 'download_status'):
                return provider.download_status
        return "unknown"
    
    def get_download_details(self, model_name: str) -> Dict[str, Any]:
        """Get download details for a model"""
        if model_name in self.providers:
            provider = self.providers[model_name]
            if hasattr(provider, 'download_details'):
                return provider.download_details
        return {}
    
    def is_downloading(self, model_name: str) -> bool:
        """Check if a model is currently downloading"""
        if model_name in self.providers:
            provider = self.providers[model_name]
            if hasattr(provider, 'is_downloading'):
                return provider.is_downloading
        return False
    
    def load_model(self, model_name: str) -> bool:
        """Load a specific model"""
        if model_name not in self.providers:
            logger.error(f"Model {model_name} not found")
            return False
        
        # Unload current model if different
        if self.current_model and self.current_model != model_name:
            self.unload_current_model()
        
        provider = self.providers[model_name]
        if provider.load_model():
            self.current_model = model_name
            logger.info(f"Successfully loaded model: {model_name}")
            return True
        else:
            logger.error(f"Failed to load model: {model_name}")
            return False
    
    def unload_current_model(self):
        """Unload the currently loaded model with proper memory cleanup"""
        if self.current_model:
            provider = self.providers[self.current_model]
            provider.unload_model()
            logger.info(f"Unloaded model: {self.current_model}")
            self.current_model = None
            
            # Force garbage collection to free memory
            gc.collect()
            logger.info("Performed garbage collection after model unload")
    
    async def switch_to(self, model_id: str) -> bool:
        """Switch to a different model with proper request blocking"""
        async with self._switching_lock:
            try:
                self._is_switching = True
                logger.info(f"Starting model switch to: {model_id}")
                
                # Check if model exists
                if model_id not in self.providers:
                    logger.error(f"Model {model_id} not found")
                    return False
                
                # If it's already the current model, no need to switch
                if self.current_model == model_id and self.is_model_loaded(model_id):
                    logger.info(f"Model {model_id} is already loaded")
                    return True
                
                # Unload current model if any
                if self.current_model:
                    logger.info(f"Unloading current model: {self.current_model}")
                    self.unload_current_model()
                
                # Load the new model
                logger.info(f"Loading new model: {model_id}")
                success = self.load_model(model_id)
                
                if success:
                    logger.info(f"Successfully switched to model: {model_id}")
                else:
                    logger.error(f"Failed to switch to model: {model_id}")
                
                return success
                
            except Exception as e:
                logger.error(f"Error during model switch: {e}")
                return False
            finally:
                self._is_switching = False
    
    def is_switching(self) -> bool:
        """Check if a model switch is currently in progress"""
        return self._is_switching
    
    def generate(self, prompt: str, model_name: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        """Generate text using the specified or current model"""
        target_model = model_name or self.current_model
        
        if not target_model:
            raise RuntimeError("No model is currently loaded")
        
        if target_model not in self.providers:
            raise RuntimeError(f"Model {target_model} not found")
        
        # Load model if not current
        if target_model != self.current_model:
            if not self.load_model(target_model):
                raise RuntimeError(f"Failed to load model {target_model}")
        
        provider = self.providers[target_model]
        if not provider.is_loaded:
            raise RuntimeError(f"Model {target_model} is not loaded")
        
        yield from provider.generate(prompt, **kwargs)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models"""
        available = []
        for model_name, provider in self.providers.items():
            if provider.is_available():
                model_config = config.get_model_config(model_name)
                available.append({
                    "name": model_name,
                    "display_name": model_config.display_name,
                    "description": model_config.description,
                    "provider": model_config.provider.value,
                    "is_loaded": provider.is_loaded,
                    "is_current": model_name == self.current_model
                })
        return available
    
    def get_current_model(self) -> Optional[str]:
        """Get the name of the currently loaded model"""
        return self.current_model
    
    def get_current_provider(self) -> Optional[BaseModelProvider]:
        """Get the currently loaded model provider"""
        if self.current_model and self.current_model in self.providers:
            return self.providers[self.current_model]
        return None
    
    def is_model_loaded(self, model_name: str) -> bool:
        """Check if a specific model is loaded"""
        return (model_name in self.providers and 
                self.providers[model_name].is_loaded)

    def cleanup(self):
        """Cleanup resources (unload current model, stop background work if any)"""
        try:
            self.unload_current_model()
        except Exception as e:
            logger.error(f"Error during ModelManager cleanup: {e}")