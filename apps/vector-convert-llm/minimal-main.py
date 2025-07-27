from flask import Flask, request, jsonify
import logging
import os
import time
import requests
import gc
import psutil
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables
model = None
model_loaded = False
model_loading = False
model_error = None
start_time = time.time()

def get_memory_usage():
    """Get current memory usage information"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        return {
            'process_memory_mb': round(memory_info.rss / 1024 / 1024, 2),
            'process_memory_percent': round(process.memory_percent(), 2)
        }
    except Exception as e:
        logger.error(f"Error getting memory usage: {e}")
        return {'process_memory_mb': 0, 'process_memory_percent': 0}

def load_model():
    """Load a very small, stable sentence transformer model"""
    global model, model_loaded, model_loading, model_error
    
    try:
        model_loading = True
        model_error = None
        
        logger.info("Loading minimal sentence-transformers model: all-MiniLM-L6-v2")
        
        # Import here to avoid issues at startup
        from sentence_transformers import SentenceTransformer
        
        # Use the smallest, most stable model available
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        
        # Test the model
        test_embedding = model.encode(["test"])
        logger.info(f"Model loaded successfully, embedding dimension: {len(test_embedding)}")
        
        model_loaded = True
        model_loading = False
        
        # Force garbage collection
        gc.collect()
        
    except Exception as e:
        model_loading = False
        model_error = str(e)
        logger.error(f"Failed to load model: {e}", exc_info=True)
        raise e

def ensure_model_loaded():
    """Ensure model is loaded (lazy loading)"""
    global model_loaded, model_loading
    
    if model_loaded:
        return True
    
    if model_loading:
        # Wait for model to finish loading
        wait_time = 0
        while model_loading and wait_time < 120:  # 2 minutes max
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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global model_loaded, model_loading, model_error, start_time
    
    uptime = time.time() - start_time
    memory_usage = get_memory_usage()
    
    if model_error:
        status = 'error'
        message = f"Model loading failed: {model_error}"
    elif model_loading:
        status = 'loading'
        message = "Model loading..."
    elif model_loaded:
        status = 'healthy'
        message = "Model ready"
    else:
        status = 'starting'
        message = "Service starting"
    
    return jsonify({
        'status': status,
        'message': message,
        'model_loaded': model_loaded,
        'model': 'all-MiniLM-L6-v2' if model_loaded else None,
        'uptime': uptime,
        'memory_usage': memory_usage
    }), 200

@app.route('/embed', methods=['POST'])
def embed_text():
    """Generate embeddings for text"""
    start_time_local = time.time()
    
    try:
        logger.info("=== EMBED REQUEST START ===")
        
        # Ensure model is loaded
        if not ensure_model_loaded():
            return jsonify({'error': 'Model failed to load'}), 500
        
        # Parse request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field'}), 400
        
        text = data['text']
        logger.info(f"Processing text (length: {len(str(text))})")
        
        # Handle both string and list inputs
        if isinstance(text, str):
            texts = [text]
            single_input = True
        elif isinstance(text, list):
            texts = text
            single_input = False
        else:
            return jsonify({'error': 'Text must be string or list'}), 400
        
        # Generate embeddings
        logger.info("Generating embeddings...")
        embeddings = model.encode(texts, show_progress_bar=False)
        
        # Convert to list format
        embeddings_list = [emb.tolist() for emb in embeddings]
        
        # Return single embedding or list based on input
        result = embeddings_list[0] if single_input else embeddings_list
        
        processing_time = int((time.time() - start_time_local) * 1000)
        
        # Force garbage collection
        gc.collect()
        
        logger.info(f"=== EMBED REQUEST SUCCESS ({processing_time}ms) ===")
        
        return jsonify({
            'embeddings': result,
            'dimension': len(embeddings_list[0]) if embeddings_list else 0,
            'model': 'all-MiniLM-L6-v2',
            'processing_time_ms': processing_time
        }), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.error(f"Error in embed_text: {e}", exc_info=True)
        
        return jsonify({
            'error': str(e),
            'processing_time_ms': processing_time
        }), 500

@app.route('/process-document', methods=['POST'])
def process_document():
    """Process document and generate embeddings"""
    start_time_local = time.time()
    
    try:
        # Ensure model is loaded
        if not ensure_model_loaded():
            return jsonify({'error': 'Model failed to load'}), 500
        
        data = request.get_json()
        if not data or 'document_id' not in data:
            return jsonify({'error': 'Missing document_id'}), 400
        
        document_id = data['document_id']
        
        # Get text content
        if 'inputText' in data:
            text = data['inputText']
        else:
            convex_url = data.get('convex_url', os.environ.get('CONVEX_URL'))
            if not convex_url:
                return jsonify({'error': 'Convex URL not provided'}), 400
            
            # Fetch document from Convex
            fetch_url = f"{convex_url}/api/documents/{document_id}"
            response = requests.get(fetch_url, timeout=30)
            
            if response.status_code != 200:
                return jsonify({'error': 'Failed to fetch document'}), 500
            
            document_data = response.json()
            text = document_data.get('content', '')
        
        if not text:
            return jsonify({'error': 'Document content is empty'}), 400
        
        logger.info(f"Processing document (length: {len(text)})")
        
        # Simple chunking - split into smaller pieces if too long
        max_length = 500
        if len(text) > max_length:
            # Simple chunking by sentences or paragraphs
            chunks = []
            sentences = text.replace('\n', ' ').split('. ')
            current_chunk = ""
            
            for sentence in sentences:
                if len(current_chunk + sentence) < max_length:
                    current_chunk += sentence + ". "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + ". "
            
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            # Limit chunks to prevent memory issues
            chunks = chunks[:10]  # Max 10 chunks
        else:
            chunks = [text]
        
        logger.info(f"Processing {len(chunks)} chunks")
        
        # Generate embeddings for chunks
        chunk_embeddings = []
        for i, chunk in enumerate(chunks):
            try:
                embedding = model.encode([chunk], show_progress_bar=False)[0]
                chunk_embeddings.append(embedding.tolist())
                
                if (i + 1) % 3 == 0:  # GC every 3 chunks
                    gc.collect()
                    
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {e}")
                continue
        
        if not chunk_embeddings:
            return jsonify({'error': 'Failed to generate embeddings'}), 500
        
        # Calculate average embedding
        import numpy as np
        avg_embedding = np.mean(chunk_embeddings, axis=0).tolist()
        
        # Save to Convex if URL provided
        convex_url = data.get('convex_url', os.environ.get('CONVEX_URL'))
        if convex_url:
            save_url = f"{convex_url}/api/embeddings?documentId={document_id}"
            save_response = requests.post(save_url, json={'embedding': avg_embedding}, timeout=30)
            
            if save_response.status_code != 200:
                logger.error(f"Failed to save to Convex: {save_response.status_code}")
        
        processing_time = int((time.time() - start_time_local) * 1000)
        
        # Final cleanup
        gc.collect()
        
        return jsonify({
            'success': True,
            'document_id': document_id,
            'embedding_dimension': len(avg_embedding),
            'model': 'all-MiniLM-L6-v2',
            'processing_time_ms': processing_time,
            'chunks_processed': len(chunk_embeddings)
        }), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.error(f"Error in process_document: {e}", exc_info=True)
        
        return jsonify({
            'error': str(e),
            'processing_time_ms': processing_time
        }), 500

if __name__ == "__main__":
    logger.info("Starting minimal vector-convert-llm service...")
    
    # Run Flask directly (no Gunicorn) for maximum stability
    app.run(
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 7999)),
        debug=False,
        threaded=False  # Single-threaded for stability
    )
