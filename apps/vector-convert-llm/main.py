from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
import os
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables to store the model and loading status
model = None
model_loaded = False

def load_model():
    """Load the sentence transformer model"""
    global model, model_loaded
    try:
        logger.info("Loading sentence-transformers model: all-distilroberta-v1")
        model = SentenceTransformer('sentence-transformers/all-distilroberta-v1')
        model_loaded = True
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'service': 'vector-convert-llm'
    }), 200

@app.route('/embed', methods=['POST'])
def embed_text():
    """Embed text using the sentence transformer model"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field in request'}), 400
        
        text = data['text']
        if isinstance(text, str):
            texts = [text]
        elif isinstance(text, list):
            texts = text
        else:
            return jsonify({'error': 'Text must be string or list of strings'}), 400
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Convert to list for JSON serialization
        if isinstance(text, str):
            # Single text input, return single embedding
            result = embeddings[0].tolist()
        else:
            # Multiple texts, return list of embeddings
            result = [emb.tolist() for emb in embeddings]
        
        return jsonify({
            'embeddings': result,
            'dimension': len(embeddings[0]),
            'model': 'all-distilroberta-v1'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in embed_text: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """Calculate similarity between texts"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing texts field in request'}), 400
        
        texts = data['texts']
        if not isinstance(texts, list) or len(texts) < 2:
            return jsonify({'error': 'texts must be a list with at least 2 items'}), 400
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Calculate similarity matrix
        similarities = model.similarity(embeddings, embeddings)
        
        return jsonify({
            'similarities': similarities.tolist(),
            'texts': texts,
            'model': 'all-distilroberta-v1'
        }), 200
        
    except Exception as e:
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
            'model': 'all-distilroberta-v1'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in semantic_search: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    load_model()
    
    # Get port from environment or default to 8081
    port = int(os.environ.get('PORT', 8081))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=False)