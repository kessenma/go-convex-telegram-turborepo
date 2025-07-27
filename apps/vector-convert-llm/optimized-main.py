from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
import os
import time
import threading
import requests
import uuid
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownTextSplitter
import json
import psutil
import gc
import signal
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables for model and status
model = None
model_loaded = False
model_loading = False
model_error = None
start_time = time.time()
load_start_time = None

# Memory management settings
MAX_CHUNK_SIZE = 500  # Reduced chunk size for better memory management
MAX_BATCH_SIZE = 1    # Process one chunk at a time to minimize memory usage
MEMORY_CLEANUP_INTERVAL = 10  # Force GC every 10 operations

# Operation counter for memory cleanup
operation_counter = 0

def cleanup_memory():
    """Force garbage collection and memory cleanup"""
    global operation_counter
    operation_counter += 1
    
    if operation_counter % MEMORY_CLEANUP_INTERVAL == 0:
        gc.collect()
        logger.debug(f"Memory cleanup performed after {operation_counter} operations")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def load_model():
    """Load the sentence transformer model synchronously"""
    global model, model_loaded, model_loading, model_error, load_start_time
    
    try:
        model_loading = True
        model_error = None
        load_start_time = time.time()
        
        logger.info("Loading sentence-transformers model: BAAI/bge-small-en")
        
        # Load model with explicit device mapping to avoid GPU issues
        model = SentenceTransformer('BAAI/bge-small-en', device='cpu')
        
        # Test the model with a simple encoding to ensure it works
        test_embedding = model.encode(["test sentence"])
        logger.info(f"Model test successful, embedding dimension: {test_embedding.shape[1]}")
        
        model_loaded = True
        model_loading = False
        
        load_duration = time.time() - load_start_time
        logger.info(f"Model loaded successfully in {load_duration:.2f} seconds")
        
    except Exception as e:
        model_loading = False
        model_error = str(e)
        logger.error(f"Failed to load model: {e}", exc_info=True)
        raise e

def get_memory_usage():
    """Get current memory usage information"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        
        # Get system memory info
        system_memory = psutil.virtual_memory()
        
        return {
            'process_memory_mb': round(memory_info.rss / 1024 / 1024, 2),
            'process_memory_percent': round(memory_percent, 2),
            'system_memory_total_gb': round(system_memory.total / 1024 / 1024 / 1024, 2),
            'system_memory_available_gb': round(system_memory.available / 1024 / 1024 / 1024, 2),
            'system_memory_used_percent': round(system_memory.percent, 2)
        }
    except Exception as e:
        logger.error(f"Error getting memory usage: {e}")
        return {
            'process_memory_mb': 0,
            'process_memory_percent': 0,
            'system_memory_total_gb': 0,
            'system_memory_available_gb': 0,
            'system_memory_used_percent': 0,
            'error': str(e)
        }

def chunk_document(content: str, content_type: str = "text", chunk_size: int = MAX_CHUNK_SIZE, chunk_overlap: int = 100) -> List[str]:
    """Chunk document content using LangChain text splitters with memory-optimized settings"""
    try:
        if content_type.lower() == "markdown":
            text_splitter = MarkdownTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
            )
        else:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
        
        chunks = text_splitter.split_text(content)
        logger.info(f"Document chunked into {len(chunks)} pieces (chunk_size={chunk_size}, overlap={chunk_overlap})")
        return chunks
        
    except Exception as e:
        logger.error(f"Error chunking document: {e}")
        return simple_chunk_text(content, chunk_size)

def simple_chunk_text(text: str, max_chunk_size: int = MAX_CHUNK_SIZE) -> List[str]:
    """Simple fallback chunking method"""
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    for i in range(0, len(text), max_chunk_size):
        chunks.append(text[i:i + max_chunk_size])
    
    return chunks

def safe_encode_batch(texts: List[str]) -> List[List[float]]:
    """Safely encode a batch of texts with memory management"""
    try:
        # Process texts one by one to minimize memory usage
        embeddings = []
        
        for i, text in enumerate(texts):
            try:
                # Encode single text
                embedding = model.encode([text], show_progress_bar=False)[0]
                embeddings.append(embedding.tolist())
                
                # Cleanup memory every few operations
                if (i + 1) % 5 == 0:
                    gc.collect()
                
                logger.debug(f"Encoded text {i+1}/{len(texts)}")
                
            except Exception as text_error:
                logger.error(f"Error encoding text {i+1}: {text_error}")
                # Skip this text and continue
                continue
        
        return embeddings
        
    except Exception as e:
        logger.error(f"Error in safe_encode_batch: {e}")
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed status"""
    global model_loaded, model_loading, model_error, start_time, load_start_time
    
    current_time = time.time()
    uptime = current_time - start_time
    
    # Get memory usage
    memory_usage = get_memory_usage()
    
    # Determine service status
    if model_error:
        status = 'error'
        ready = False
        message = f"Model loading failed: {model_error}"
    elif model_loading:
        status = 'loading'
        ready = False
        if load_start_time:
            load_duration = current_time - load_start_time
            message = f"Model loading... ({load_duration:.1f}s elapsed)"
        else:
            message = "Model loading..."
    elif model_loaded:
        status = 'healthy'
        ready = True
        message = "Model ready for inference"
    else:
        status = 'starting'
        ready = False
        message = "Service starting, model not yet loaded"
    
    return jsonify({
        'status': status,
        'ready': ready,
        'message': message,
        'model_loaded': model_loaded,
        'model_loading': model_loading,
        'model': 'BAAI/bge-small-en' if model_loaded else None,
        'service': 'vector-convert-llm-optimized',
        'uptime': uptime,
        'error': model_error,
        'memory_usage': memory_usage,
        'operation_count': operation_counter
    }), 200

@app.route('/embed', methods=['POST'])
def embed_text():
    """Embed text using the sentence transformer model with memory optimization"""
    start_time_local = time.time()
    
    try:
        logger.info("=== EMBED ENDPOINT START ===")
        
        # Ensure model is loaded (lazy loading)
        if not ensure_model_loaded():
            return jsonify({'error': 'Model failed to load'}), 500
        
        # Parse request data
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field in request'}), 400
        
        text = data['text']
        logger.info(f"Processing text (length: {len(str(text))})")
        
        # Validate and prepare text input
        if isinstance(text, str):
            texts = [text]
        elif isinstance(text, list):
            texts = text
        else:
            return jsonify({'error': 'Text must be string or list of strings'}), 400
        
        # Generate embeddings with memory management
        logger.info("Starting embedding generation...")
        embeddings_list = safe_encode_batch(texts)
        
        if not embeddings_list:
            return jsonify({'error': 'Failed to generate any embeddings'}), 500
        
        # Prepare response
        if isinstance(text, str):
            result = embeddings_list[0]
        else:
            result = embeddings_list
        
        processing_time = int((time.time() - start_time_local) * 1000)
        
        response_data = {
            'embeddings': result,
            'dimension': len(embeddings_list[0]) if embeddings_list else 0,
            'model': 'BAAI/bge-small-en',
            'processing_time_ms': processing_time
        }
        
        # Cleanup memory
        cleanup_memory()
        
        logger.info(f"=== EMBED ENDPOINT SUCCESS ({processing_time}ms) ===")
        return jsonify(response_data), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.error(f"CRITICAL ERROR in embed_text: {e}", exc_info=True)
        
        return jsonify({
            'error': str(e),
            'error_type': type(e).__name__,
            'processing_time_ms': processing_time
        }), 500

@app.route('/process-document', methods=['POST'])
def process_document_embedding():
    """Process document with optimized memory management"""
    start_time_local = time.time()
    
    try:
        # Ensure model is loaded (lazy loading)
        if not ensure_model_loaded():
            return jsonify({'error': 'Model failed to load'}), 500
        
        data = request.get_json()
        if not data or 'document_id' not in data:
            return jsonify({'error': 'Missing document_id field in request'}), 400
        
        document_id = data['document_id']
        convex_url = data.get('convex_url', os.environ.get('CONVEX_URL'))
        
        # Get text content
        if 'inputText' in data:
            text = data['inputText']
            logger.info(f"Using inputText from request, length: {len(text)}")
        else:
            if not convex_url:
                return jsonify({'error': 'Convex URL not provided'}), 400
            
            # Fetch document from Convex
            fetch_url = f"{convex_url}/api/documents/{document_id}"
            fetch_response = requests.get(fetch_url, timeout=30)
            
            if fetch_response.status_code != 200:
                return jsonify({
                    'error': 'Failed to fetch document from Convex',
                    'convex_status': fetch_response.status_code
                }), 500
            
            document_data = fetch_response.json()
            text = document_data.get('content')
            
            if not text:
                return jsonify({'error': 'Document content is empty'}), 400
        
        logger.info(f"Processing document (length: {len(text)})")
        
        # Chunk document with smaller chunks for better memory management
        content_type = data.get('contentType', 'text')
        chunks = chunk_document(text, content_type, MAX_CHUNK_SIZE, 50)
        
        if len(chunks) > 20:  # Limit number of chunks to prevent memory issues
            logger.warning(f"Document has {len(chunks)} chunks, limiting to first 20")
            chunks = chunks[:20]
        
        logger.info(f"Processing {len(chunks)} chunks")
        
        # Generate embeddings for chunks with aggressive memory management
        chunk_embeddings = []
        
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)}")
                
                # Process single chunk
                embedding = model.encode([chunk], show_progress_bar=False)[0].tolist()
                chunk_embeddings.append(embedding)
                
                # Force garbage collection after each chunk
                gc.collect()
                
                # Log memory usage periodically
                if (i + 1) % 5 == 0:
                    memory_info = get_memory_usage()
                    logger.info(f"Memory usage after chunk {i+1}: {memory_info['process_memory_mb']}MB")
                
            except Exception as chunk_error:
                logger.error(f"Error processing chunk {i+1}: {chunk_error}")
                continue
        
        if not chunk_embeddings:
            return jsonify({'error': 'Failed to generate embeddings for any chunks'}), 500
        
        # Calculate average embedding
        avg_embedding = np.mean(chunk_embeddings, axis=0).tolist()
        logger.info(f"Calculated average embedding from {len(chunk_embeddings)} chunks")
        
        # Save embedding to Convex
        if convex_url:
            save_url = f"{convex_url}/api/embeddings?documentId={document_id}"
            save_payload = {'embedding': avg_embedding}
            
            save_response = requests.post(save_url, json=save_payload, timeout=30)
            
            if save_response.status_code != 200:
                logger.error(f"Failed to save to Convex: {save_response.status_code}")
                return jsonify({
                    'error': 'Failed to save embedding to Convex',
                    'convex_status': save_response.status_code
                }), 500
        
        processing_time = int((time.time() - start_time_local) * 1000)
        
        # Final memory cleanup
        cleanup_memory()
        
        return jsonify({
            'success': True,
            'document_id': document_id,
            'embedding_dimension': len(avg_embedding),
            'model': 'BAAI/bge-small-en',
            'processing_time_ms': processing_time,
            'content_length': len(text),
            'chunks_processed': len(chunk_embeddings),
            'embedding_method': 'chunked_average'
        }), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.error(f"Error in process_document_embedding: {e}", exc_info=True)
        
        return jsonify({
            'error': str(e),
            'processing_time_ms': processing_time
        }), 500

def ensure_model_loaded():
    """Ensure model is loaded before processing requests (lazy loading)"""
    global model_loaded, model_loading
    
    if model_loaded:
        return True
    
    if model_loading:
        # Wait for model to finish loading (up to 5 minutes)
        wait_time = 0
        while model_loading and wait_time < 300:
            time.sleep(1)
            wait_time += 1
        return model_loaded
    
    # Load model now
    try:
        load_model()
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting vector-convert-llm service with lazy model loading...")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 7999)), debug=False)
