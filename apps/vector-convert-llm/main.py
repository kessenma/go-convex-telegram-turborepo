from flask import Flask, request, jsonify
from flask_cors import CORS
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
import threading
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins=['http://localhost:3000', 'http://localhost:3210', 'http://localhost:3211'])

# Add request logging middleware
@app.before_request
def log_request_info():
    try:
        logger.info(f"Incoming request: {request.method} {request.path}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Content-Type: {request.content_type}")
        if request.content_type == 'application/json':
            try:
                data = request.get_json(force=True)
                logger.info(f"Request JSON: {data}")
            except Exception as e:
                logger.info(f"Failed to parse JSON: {e}")
                logger.info(f"Raw data: {request.get_data()}")
        else:
            logger.info(f"Request data: {request.get_data()}")
    except Exception as e:
        logger.error(f"Error in request logging: {e}")

@app.after_request
def log_response_info(response):
    try:
        logger.info(f"Response status: {response.status_code}")
    except Exception as e:
        logger.error(f"Error in response logging: {e}")
    return response

# Global variables to store the model and loading status
model = None
model_loaded = False
model_loading = False
model_error = None
start_time = time.time()
load_start_time = None

def create_conversion_job(job_type, document_id=None, input_text=None, request_source="api"):
    """Create a new conversion job in Convex"""
    try:
        convex_url = os.environ.get('CONVEX_URL')
        if not convex_url:
            return None
            
        job_id = str(uuid.uuid4())
        job_data = {
            'jobId': job_id,
            'jobType': job_type,
            'documentId': document_id,
            'inputText': input_text,
            'requestSource': request_source,
        }
        
        response = requests.post(f"{convex_url}/http/api/conversion-jobs", json=job_data)
        if response.status_code == 200:
            return job_id
        else:
            logger.error(f"Failed to create conversion job: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error creating conversion job: {e}")
        return None

def update_conversion_job(job_id, status, output_data=None, error_message=None, processing_time_ms=None):
    """Update a conversion job status in Convex"""
    try:
        convex_url = os.environ.get('CONVEX_URL')
        if not convex_url or not job_id:
            return False
            
        update_data = {
            'jobId': job_id,
            'status': status,
            'llmModel': 'all-MiniLM-L6-v2',
        }
        
        if output_data is not None:
            update_data['outputData'] = output_data
        if error_message is not None:
            update_data['errorMessage'] = error_message
        if processing_time_ms is not None:
            update_data['processingTimeMs'] = processing_time_ms
            
        response = requests.put(f"{convex_url}/http/api/conversion-jobs", json=update_data)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Error updating conversion job: {e}")
        return False

def load_model():
    """Load the sentence transformer model"""
    global model, model_loaded, model_loading, model_error, load_start_time
    try:
        model_loading = True
        model_error = None
        load_start_time = time.time()
        logger.info("Loading minimal sentence-transformers model: all-MiniLM-L6-v2")
        
        # Import here to avoid startup issues
        from sentence_transformers import SentenceTransformer
        
        # Use a smaller, more stable model to avoid segmentation faults
        model = SentenceTransformer('all-MiniLM-L6-v2')
        model_loaded = True
        model_loading = False
        logger.info("Model loaded successfully")
    except Exception as e:
        model_loading = False
        model_error = str(e)
        logger.error(f"Failed to load model: {e}")
        raise e

def load_model_async():
    """Load model in background thread"""
    try:
        load_model()
    except Exception as e:
        logger.error(f"Background model loading failed: {e}")

def chunk_document(content: str, content_type: str = "text", chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Chunk document content using LangChain text splitters"""
    try:
        if content_type.lower() == "markdown":
            # Use MarkdownTextSplitter for markdown content
            text_splitter = MarkdownTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
            )
        else:
            # Use RecursiveCharacterTextSplitter for other content types
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
        # Fallback to simple chunking if LangChain fails
        return simple_chunk_text(content, chunk_size)

def simple_chunk_text(text: str, max_chunk_size: int = 1000) -> List[str]:
    """Simple fallback chunking method"""
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    for i in range(0, len(text), max_chunk_size):
        chunks.append(text[i:i + max_chunk_size])
    
    return chunks

@app.route('/routes', methods=['GET'])
def list_routes():
    """List all available routes for debugging"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify({'routes': routes}), 200

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

def send_memory_usage_to_convex():
    """Send memory usage data to Convex backend"""
    try:
        convex_url = os.environ.get('CONVEX_URL')
        if not convex_url:
            logger.debug("CONVEX_URL not set, skipping memory usage reporting")
            return
            
        memory_usage = get_memory_usage()
        
        # Add model status information
        global model_loaded, model_loading, model_error
        if model_error:
            model_status = 'error'
        elif model_loading:
            model_status = 'loading'
        elif model_loaded:
            model_status = 'healthy'
        else:
            model_status = 'starting'
            
        payload = {
            **memory_usage,
            'model_status': model_status,
            'timestamp': int(time.time() * 1000)  # milliseconds
        }
        
        response = requests.post(
            f"{convex_url}/http/api/llm/memory-usage",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            logger.debug(f"Memory usage sent to Convex: {memory_usage['process_memory_mb']}MB")
        else:
            logger.warning(f"Failed to send memory usage to Convex: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error sending memory usage to Convex: {e}")

def memory_monitoring_worker():
    """Background worker to periodically send memory usage data"""
    while True:
        try:
            send_memory_usage_to_convex()
            time.sleep(30)  # Send memory data every 30 seconds
        except Exception as e:
            logger.error(f"Error in memory monitoring worker: {e}")
            time.sleep(60)  # Wait longer on error

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed status and memory usage"""
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
            message = f"Model downloading/loading... ({load_duration:.1f}s elapsed)"
        else:
            message = "Model downloading/loading..."
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
        'model': 'sentence-transformers/all-MiniLM-L6-v2' if model_loaded else None,
        'service': 'vector-convert-llm',
        'uptime': uptime,
        'error': model_error,
        'memory_usage': memory_usage
    }), 200

@app.route('/test-post', methods=['POST'])
def test_post():
    """Simple test endpoint for POST requests"""
    logger.info("Received POST request to /test-post")
    try:
        data = request.get_json()
        logger.info(f"Request data: {data}")
        return jsonify({
            'status': 'success',
            'message': 'POST request received successfully',
            'received_data': data
        }), 200
    except Exception as e:
        logger.error(f"Error in test_post: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/encode', methods=['POST'])
def encode_sentences():
    """
    Simple API endpoint to encode a list of sentences into embeddings.
    Expects a JSON payload with a 'sentences' key containing a list of strings.
    This matches the example you provided.
    """
    logger.info("=== ENCODE ENDPOINT START ===")
    logger.info("Received POST request to /encode")
    
    try:
        # Check if model is loaded
        if model is None or not model_loaded:
            logger.error("Model not loaded")
            return jsonify({"error": "Model not loaded"}), 500
        
        # Parse JSON data
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        if not data or 'sentences' not in data or not isinstance(data['sentences'], list):
            logger.error("Invalid input format")
            return jsonify({"error": "Invalid input. Please provide a JSON object with a 'sentences' key containing a list of strings."}), 400

        sentences = data['sentences']
        logger.info(f"Processing {len(sentences)} sentences")
        
        try:
            embeddings = model.encode(sentences).tolist()  # Convert numpy array to list for JSON serialization
            logger.info(f"Successfully generated embeddings with shape: {len(embeddings)}x{len(embeddings[0]) if embeddings else 0}")
            
            response = {"embeddings": embeddings}
            logger.info("=== ENCODE ENDPOINT SUCCESS ===")
            return jsonify(response), 200
            
        except Exception as e:
            logger.error(f"Error during encoding: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error(f"CRITICAL ERROR in encode_sentences: {e}", exc_info=True)
        logger.error("=== ENCODE ENDPOINT FAILED ===")
        return jsonify({"error": str(e)}), 500

@app.route('/embed', methods=['POST'])
def embed_text():
    """Embed text using the sentence transformer model"""
    start_time_local = time.time()
    
    try:
        print("DEBUG: /embed endpoint called!")
        logger.info("=== EMBED ENDPOINT START ===")
        logger.info("Received POST request to /embed")
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Request path: {request.path}")
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        
        # Check model status with detailed logging
        logger.info(f"Model status check: model={model}, model_loaded={model_loaded}, model_loading={model_loading}")
        if model is None:
            logger.error("Model is None - not loaded")
            return jsonify({'error': 'Model not loaded'}), 500
        
        if not model_loaded:
            logger.error(f"Model not ready - loaded: {model_loaded}, loading: {model_loading}")
            return jsonify({'error': 'Model not ready'}), 500
        
        # Parse request data with detailed logging
        logger.info("Parsing request JSON...")
        try:
            data = request.get_json(force=True)
            logger.info(f"Successfully parsed JSON: {data}")
        except Exception as json_error:
            logger.error(f"Failed to parse JSON: {json_error}")
            logger.error(f"Raw request data: {request.get_data()}")
            return jsonify({'error': f'Invalid JSON: {str(json_error)}'}), 400
        
        if not data or 'text' not in data:
            logger.error(f"Missing text field in request. Data keys: {list(data.keys()) if data else 'None'}")
            return jsonify({'error': 'Missing text field in request'}), 400
        
        text = data['text']
        logger.info(f"Processing text (length: {len(str(text))}): {str(text)[:100]}...")
        
        # Validate text input
        if isinstance(text, str):
            texts = [text]
            logger.info("Processing single string")
        elif isinstance(text, list):
            texts = text
            logger.info(f"Processing list of {len(texts)} strings")
        else:
            logger.error(f"Invalid text type: {type(text)}")
            return jsonify({'error': 'Text must be string or list of strings'}), 400
        
        # Generate embeddings with detailed logging
        logger.info("Starting embedding generation...")
        try:
            embeddings = model.encode(texts)
            logger.info(f"Embeddings generated successfully. Shape: {embeddings.shape}")
        except Exception as embed_error:
            logger.error(f"Error during embedding generation: {embed_error}", exc_info=True)
            return jsonify({'error': f'Embedding generation failed: {str(embed_error)}'}), 500
        
        # Convert to list for JSON serialization
        logger.info("Converting embeddings to JSON-serializable format...")
        try:
            if isinstance(text, str):
                # Single text input, return single embedding
                result = embeddings[0].tolist()
                logger.info(f"Single embedding converted, dimension: {len(result)}")
            else:
                # Multiple texts, return list of embeddings
                result = [emb.tolist() for emb in embeddings]
                logger.info(f"Multiple embeddings converted, count: {len(result)}")
        except Exception as convert_error:
            logger.error(f"Error converting embeddings to list: {convert_error}", exc_info=True)
            return jsonify({'error': f'Result conversion failed: {str(convert_error)}'}), 500
        
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.info(f"Processing completed successfully in {processing_time}ms")
        
        response_data = {
            'embeddings': result,
            'dimension': len(embeddings[0]),
            'model': 'all-MiniLM-L6-v2',
            'processing_time_ms': processing_time
        }
        
        logger.info(f"Returning response with {len(str(response_data))} characters")
        logger.info("=== EMBED ENDPOINT SUCCESS ===")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time_local) * 1000)
        logger.error(f"CRITICAL ERROR in embed_text: {e}", exc_info=True)
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error args: {e.args}")
        logger.error("=== EMBED ENDPOINT FAILED ===")
        
        try:
            error_response = {
                'error': str(e),
                'error_type': type(e).__name__,
                'processing_time_ms': processing_time
            }
            return jsonify(error_response), 500
        except Exception as response_error:
            logger.error(f"Failed to create error response: {response_error}")
            # Return a simple string response as last resort
            return f"Internal server error: {str(e)}", 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """Calculate similarity between texts"""
    start_time = time.time()
    job_id = None
    
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing texts field in request'}), 400
        
        texts = data['texts']
        if not isinstance(texts, list) or len(texts) < 2:
            return jsonify({'error': 'texts must be a list with at least 2 items'}), 400
        
        # Create conversion job
        job_id = create_conversion_job(
            job_type="similarity",
            input_text=str(texts[:100]) if texts else None,  # Truncate for storage
            request_source="api"
        )
        
        if job_id:
            update_conversion_job(job_id, "processing")
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Calculate similarity matrix
        similarities = model.similarity(embeddings, embeddings)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Update job as completed
        if job_id:
            output_data = {
                "text_count": len(texts),
                "model": "all-MiniLM-L6-v2",
                "similarity_matrix_size": f"{len(texts)}x{len(texts)}"
            }
            update_conversion_job(job_id, "completed", output_data=output_data, processing_time_ms=processing_time)
        
        return jsonify({
            'similarities': similarities.tolist(),
            'texts': texts,
            'model': 'all-MiniLM-L6-v2'
        }), 200
        
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        
        # Update job as failed
        if job_id:
            update_conversion_job(job_id, "failed", error_message=str(e), processing_time_ms=processing_time)
        
        logger.error(f"Error in calculate_similarity: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def semantic_search():
    """Perform semantic search"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'query' not in data or 'documents' not in data:
            return jsonify({'error': 'Missing query or documents field in request'}), 400
        
        query = data['query']
        documents = data['documents']
        top_k = data.get('top_k', 5)
        
        if not isinstance(documents, list):
            return jsonify({'error': 'documents must be a list'}), 400
        
        # Generate embeddings
        query_embedding = model.encode([query])
        doc_embeddings = model.encode(documents)
        
        # Calculate similarities
        similarities = model.similarity(query_embedding, doc_embeddings)[0]
        
        # Get top-k results
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                'document': documents[idx],
                'score': float(similarities[idx]),
                'index': int(idx)
            })
        
        return jsonify({
            'query': query,
            'results': results,
            'model': 'all-MiniLM-L6-v2'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in semantic_search: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/process-document', methods=['POST'])
def process_document_embedding():
    """Fetch document from Convex, generate embedding with chunking, and save back to Convex"""
    start_time = time.time()
    job_id = None
    
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'document_id' not in data:
            return jsonify({'error': 'Missing document_id field in request'}), 400
        
        document_id = data['document_id']
        # Always use the internal Docker network URL for Convex
        convex_url = os.environ.get('CONVEX_URL', 'http://convex-backend:3211')
        use_chunking = data.get('use_chunking', True)  # Enable chunking by default
        chunk_size = data.get('chunk_size', 1000)
        chunk_overlap = data.get('chunk_overlap', 200)
        
        if not convex_url:
            return jsonify({'error': 'Convex URL not provided'}), 400
        
        logger.info(f"Processing document embedding for ID: {document_id} (chunking: {use_chunking})")
        logger.info(f"Convex URL used: {convex_url}")
        
        # Create conversion job
        job_id = create_conversion_job(
            job_type="document_embedding",
            document_id=document_id,
            request_source="web_app"
        )
        
        if job_id:
            update_conversion_job(job_id, "processing")
        
        # Fetch document from Convex
        logger.info(f"Fetching document from Convex: {document_id}")
        fetch_url = f"{convex_url}/api/documents/{document_id}"
        logger.info(f"Fetching document from Convex at: {fetch_url}")
        fetch_response = requests.get(fetch_url)
        
        if fetch_response.status_code != 200:
            error_msg = f"Failed to fetch document from Convex: {fetch_response.status_code} - {fetch_response.text}"
            logger.error(error_msg)
            if job_id:
                update_conversion_job(job_id, "failed", error_message=error_msg)
            return jsonify({
                'error': 'Failed to fetch document from Convex',
                'convex_status': fetch_response.status_code,
                'convex_error': fetch_response.text
            }), 500
        
        document_data = fetch_response.json()
        text = document_data.get('content')
        content_type = document_data.get('contentType', 'text')
        document_title = document_data.get('title', 'Unknown Document')
        
        if not text:
            error_msg = "Document content is empty or missing"
            logger.error(error_msg)
            if job_id:
                update_conversion_job(job_id, "failed", error_message=error_msg)
            return jsonify({'error': error_msg}), 400
        
        logger.info(f"Document fetched successfully, content length: {len(text)}, type: {content_type}")
        
        # Generate embedding with chunking
        if use_chunking and len(text) > chunk_size:
            logger.info("‼️Using chunking for large documen🤖...")
            
            # Chunk the document
            chunks = chunk_document(text, content_type, chunk_size, chunk_overlap)
            
            # Generate embeddings for each chunk with memory management
            logger.info(f"Generating embeddings for {len(chunks)} chunks...")
            chunk_embeddings = []
            
            # Process chunks in smaller batches to prevent memory issues
            batch_size = 2  # Process 2 chunks at a time to reduce memory pressure
            
            for batch_start in range(0, len(chunks), batch_size):
                batch_end = min(batch_start + batch_size, len(chunks))
                batch_chunks = chunks[batch_start:batch_end]
                
                try:
                    # Process batch of chunks
                    logger.info(f"Processing batch {batch_start//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size} (chunks {batch_start+1}-{batch_end})")
                    
                    # Generate embeddings for the batch
                    batch_embeddings = model.encode(batch_chunks, show_progress_bar=False)
                    
                    # Add each embedding to the list
                    for i, embedding in enumerate(batch_embeddings):
                        chunk_embeddings.append(embedding.tolist())
                        logger.info(f"Generated embedding for chunk {batch_start + i + 1}/{len(chunks)}")
                    
                    # Force garbage collection after each batch
                    import gc
                    gc.collect()
                    
                except Exception as batch_error:
                    logger.error(f"Error processing batch {batch_start//batch_size + 1}: {batch_error}")
                    
                    # Fallback: try processing chunks individually in this batch
                    for i, chunk in enumerate(batch_chunks):
                        try:
                            chunk_embedding = model.encode([chunk], show_progress_bar=False)[0].tolist()
                            chunk_embeddings.append(chunk_embedding)
                            logger.info(f"Generated embedding for chunk {batch_start + i + 1}/{len(chunks)} (individual fallback)")
                        except Exception as chunk_error:
                            logger.error(f"Error generating embedding for chunk {batch_start + i + 1}: {chunk_error}")
                            continue
            
            if not chunk_embeddings:
                error_msg = "Failed to generate embeddings for any chunks"
                logger.error(error_msg)
                if job_id:
                    update_conversion_job(job_id, "failed", error_message=error_msg)
                return jsonify({'error': error_msg}), 500
            
            # Calculate average embedding from all chunks
            avg_embedding = np.mean(chunk_embeddings, axis=0).tolist()
            logger.info(f"Calculated average embedding from {len(chunk_embeddings)} chunks, dimension: {len(avg_embedding)}")
            
            embedding = avg_embedding
            embedding_method = "chunked_average"
            
        else:
            # Generate single embedding for small documents
            logger.info("Generating single embedding for document...")
            embedding = model.encode([text])[0].tolist()
            logger.info(f"Embedding generated successfully, dimension: {len(embedding)}")
            embedding_method = "single"
        
        # Save embedding back to Convex
        logger.info("Saving embedding back to Convex...")
        save_url = f"{convex_url}/api/embeddings?documentId={document_id}"
        save_payload = {
            'embedding': embedding
        }
        
        save_response = requests.post(save_url, json=save_payload)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        if save_response.status_code == 200:
            logger.info("Embedding saved successfully to Convex")
            
            # Create notification for successful embedding
            try:
                notification_url = f"{convex_url}/api/notifications"
                notification_payload = {
                    'type': 'document_embedded',
                    'title': 'Document Embedded',
                    'message': f'"{document_title}" embedding completed successfully',
                    'documentId': document_id,
                    'metadata': json.dumps({
                        'document_title': document_title,
                        'embedding_dimension': len(embedding),
                        'model': 'all-MiniLM-L6-v2',
                        'processing_time_ms': processing_time,
                        'embedding_method': embedding_method
                    })
                }
                
                notification_response = requests.post(notification_url, json=notification_payload)
                if notification_response.status_code in (200, 201):
                    logger.info("Notification created successfully")
                else:
                    logger.warning(f"Failed to create notification: {notification_response.status_code} - {notification_response.text}")
            except Exception as notification_error:
                logger.error(f"Error creating notification: {notification_error}")
            
            # Update job as completed
            if job_id:
                output_data = {
                    "document_id": document_id,
                    "embedding_dimension": len(embedding),
                    "model": "all-MiniLM-L6-v2",
                    "content_length": len(text),
                    "embedding_method": embedding_method,
                    "chunks_processed": len(chunk_embeddings) if use_chunking and len(text) > chunk_size else 1
                }
                update_conversion_job(job_id, "completed", output_data=json.dumps(output_data), processing_time_ms=processing_time)
            
            return jsonify({
                'success': True,
                'document_id': document_id,
                'embedding_dimension': len(embedding),
                'model': 'all-MiniLM-L6-v2',
                'processing_time_ms': processing_time,
                'content_length': len(text),
                'embedding_method': embedding_method,
                'chunks_processed': len(chunk_embeddings) if use_chunking and len(text) > chunk_size else 1
            }), 200
        else:
            error_msg = f"Failed to save embedding to Convex: {save_response.status_code} - {save_response.text}"
            logger.error(error_msg)
            
            # Update job as failed
            if job_id:
                update_conversion_job(job_id, "failed", error_message=error_msg, processing_time_ms=processing_time)
            
            return jsonify({
                'error': 'Failed to save embedding to Convex',
                'convex_status': save_response.status_code,
                'convex_error': save_response.text
            }), 500
        
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        error_msg = f"Error in process_document_embedding: {e}"
        logger.error(error_msg, exc_info=True)
        
        # Update job as failed
        if job_id:
            update_conversion_job(job_id, "failed", error_message=str(e), processing_time_ms=processing_time)
        
        return jsonify({'error': str(e)}), 500

@app.route('/process-markdown', methods=['POST'])
def process_markdown_document():
    """Process markdown content with chunking and generate embeddings"""
    start_time = time.time()
    job_id = None
    
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Missing content field in request'}), 400
        
        content = data['content']
        document_id = data.get('document_id')
        convex_url = data.get('convex_url', os.environ.get('CONVEX_URL'))
        chunk_size = data.get('chunk_size', 1000)
        chunk_overlap = data.get('chunk_overlap', 200)
        
        if not convex_url:
            return jsonify({'error': 'Convex URL not provided'}), 400
        
        logger.info(f"Processing markdown document (length: {len(content)})")
        
        # Create conversion job
        job_id = create_conversion_job(
            job_type="markdown_embedding",
            document_id=document_id,
            request_source="web_app"
        )
        
        if job_id:
            update_conversion_job(job_id, "processing")
        
        # Chunk the markdown content
        chunks = chunk_document(content, 'markdown', chunk_size, chunk_overlap)
        logger.info(f"Document chunked into 🧩 {len(chunks)} pieces")
        
        # Generate embeddings for each chunk with memory management
        chunk_embeddings = []
        chunk_texts = []
        
        # Process chunks in smaller batches to prevent memory issues
        batch_size = 2  # Process 2 chunks at a time to reduce memory pressure
        
        for batch_start in range(0, len(chunks), batch_size):
            batch_end = min(batch_start + batch_size, len(chunks))
            batch_chunks = chunks[batch_start:batch_end]
            
            try:
                # Process batch of chunks
                logger.info(f"Processing batch {batch_start//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size} (chunks {batch_start+1}-{batch_end})")
                
                # Generate embeddings for the batch
                batch_embeddings = model.encode(batch_chunks, show_progress_bar=False)
                
                # Add each embedding to the list
                for i, embedding in enumerate(batch_embeddings):
                    chunk_embeddings.append(embedding.tolist())
                    chunk_texts.append(batch_chunks[i])
                    logger.info(f"Generated embedding for chunk {batch_start + i + 1}/{len(chunks)}")
                
                # Force garbage collection after each batch
                import gc
                gc.collect()
                
            except Exception as batch_error:
                logger.error(f"Error processing batch {batch_start//batch_size + 1}: {batch_error}")
                
                # Fallback: try processing chunks individually in this batch
                for i, chunk in enumerate(batch_chunks):
                    try:
                        chunk_embedding = model.encode([chunk], show_progress_bar=False)[0].tolist()
                        chunk_embeddings.append(chunk_embedding)
                        chunk_texts.append(chunk)
                        logger.info(f"Generated embedding for chunk {batch_start + i + 1}/{len(chunks)} (individual fallback)")
                    except Exception as chunk_error:
                        logger.error(f"Error generating embedding for chunk {batch_start + i + 1}: {chunk_error}")
                        continue
        
        if not chunk_embeddings:
            error_msg = "Failed to generate embeddings for any chunks"
            logger.error(error_msg)
            if job_id:
                update_conversion_job(job_id, "failed", error_message=error_msg)
            return jsonify({'error': error_msg}), 500
        
        # Calculate average embedding
        avg_embedding = np.mean(chunk_embeddings, axis=0).tolist()
        logger.info(f"Calculated average embedding from {len(chunk_embeddings)} chunks, dimension: {len(avg_embedding)}")
        
        # Save to Convex
        save_url = f"{convex_url}/http/api/embeddings"
        save_payload = {
            'text': content,
            'embedding': avg_embedding,
            'document_id': document_id,
            'chunks': chunk_texts,
            'chunk_embeddings': chunk_embeddings,
            'metadata': {
                'content_type': 'markdown',
                'chunk_count': len(chunks),
                'embedding_method': 'chunked_average',
                'model': 'all-MiniLM-L6-v2'
            }
        }
        
        save_response = requests.post(save_url, json=save_payload)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        if save_response.status_code == 200:
            logger.info("Markdown embedding saved successfully to Convex")
            
            # Create notification for successful embedding
            try:
                notification_url = f"{convex_url}/api/notifications"
                notification_payload = {
                    'type': 'document_embedded',
                    'title': 'Document Embedded',
                    'message': f'Markdown document embedding completed successfully',
                    'documentId': document_id,
                    'metadata': json.dumps({
                        'embedding_dimension': len(avg_embedding),
                        'model': 'all-MiniLM-L6-v2',
                        'processing_time_ms': processing_time,
                        'embedding_method': 'chunked_average',
                        'chunks_processed': len(chunk_embeddings)
                    })
                }
                
                notification_response = requests.post(notification_url, json=notification_payload)
                if notification_response.status_code in (200, 201):
                    logger.info("Notification created successfully")
                else:
                    logger.warning(f"Failed to create notification: {notification_response.status_code} - {notification_response.text}")
            except Exception as notification_error:
                logger.error(f"Error creating notification: {notification_error}")
            
            # Update job as completed
            if job_id:
                output_data = {
                    "document_id": document_id,
                    "embedding_dimension": len(avg_embedding),
                    "model": "all-MiniLM-L6-v2",
                    "content_length": len(content),
                    "chunks_processed": len(chunk_embeddings),
                    "embedding_method": "chunked_average"
                }
                update_conversion_job(job_id, "completed", output_data=json.dumps(output_data), processing_time_ms=processing_time)
            
            return jsonify({
                'success': True,
                'document_id': document_id,
                'embedding_dimension': len(avg_embedding),
                'model': 'all-MiniLM-L6-v2',
                'processing_time_ms': processing_time,
                'content_length': len(content),
                'chunks_processed': len(chunk_embeddings),
                'embedding_method': 'chunked_average'
            }), 200
        else:
            error_msg = f"Failed to save to Convex: {save_response.status_code} - {save_response.text}"
            logger.error(error_msg)
            
            # Update job as failed
            if job_id:
                update_conversion_job(job_id, "failed", error_message=error_msg, processing_time_ms=processing_time)
            
            return jsonify({
                'error': 'Failed to save to Convex',
                'convex_status': save_response.status_code,
                'convex_error': save_response.text
            }), 500
        
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        error_msg = f"Error in process_markdown_document: {e}"
        logger.error(error_msg, exc_info=True)
        
        # Update job as failed
        if job_id:
            update_conversion_job(job_id, "failed", error_message=str(e), processing_time_ms=processing_time)
        
        return jsonify({'error': str(e)}), 500


@app.route('/embed-and-save', methods=['POST'])
def embed_and_save():
    """Generate embeddings and save them to Convex backend (legacy endpoint)"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'document_id' not in data or 'text' not in data:
            return jsonify({'error': 'Missing document_id or text field in request'}), 400
        
        document_id = data['document_id']
        text = data['text']
        convex_url = data.get('convex_url', os.environ.get('CONVEX_URL'))
        
        if not convex_url:
            return jsonify({'error': 'Convex URL not provided'}), 400
        
        # Generate embedding
        embedding = model.encode([text])[0].tolist()
        
        # Save to Convex
        convex_endpoint = f"{convex_url}/updateDocumentEmbedding"
        convex_payload = {
            'documentId': document_id,
            'embedding': embedding
        }
        
        response = requests.post(convex_endpoint, json=convex_payload)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'document_id': document_id,
                'embedding_dimension': len(embedding),
                'model': 'all-MiniLM-L6-v2',
                'convex_response': response.json()
            }), 200
        else:
            logger.error(f"Failed to save to Convex: {response.status_code} - {response.text}")
            return jsonify({
                'error': 'Failed to save embedding to Convex',
                'convex_status': response.status_code,
                'convex_error': response.text
            }), 500
        
    except Exception as e:
        logger.error(f"Error in embed_and_save_to_convex: {e}")
        return jsonify({'error': str(e)}), 500

# Start model loading in background thread when module is imported
logger.info("Starting vector-convert-llm service...")
model_thread = threading.Thread(target=load_model_async, daemon=True)
model_thread.start()

# Start memory monitoring worker thread
logger.info("Starting memory monitoring worker...")
memory_thread = threading.Thread(target=memory_monitoring_worker, daemon=True)
memory_thread.start()

logger.info("Service initialized, model loading in background...")
logger.info("Available endpoints: /health, /embed, /similarity, /search, /process-document, /process-markdown, /embed-and-save")

if __name__ == '__main__':
    logger.info("Starting minimal vector-convert-llm service...")
    app.run(host='0.0.0.0', port=8081, debug=False, threaded=True)
