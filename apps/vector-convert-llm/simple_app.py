from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import logging
import time
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables to store the model and loading status
model = None
model_loaded = False
model_loading = False

def load_model():
    """Load the sentence transformer model"""
    global model, model_loaded, model_loading
    try:
        model_loading = True
        logger.info("Loading sentence-transformers model: all-distilroberta-v1")
        model = SentenceTransformer('sentence-transformers/all-distilroberta-v1')
        model_loaded = True
        model_loading = False
        logger.info("Model loaded successfully")
    except Exception as e:
        model_loading = False
        logger.error(f"Failed to load model: {e}")
        raise e

def load_model_async():
    """Load model in background thread"""
    try:
        load_model()
    except Exception as e:
        logger.error(f"Background model loading failed: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if model_loaded else 'loading',
        'model_loaded': model_loaded,
        'model_loading': model_loading,
        'service': 'simple-vector-convert-llm'
    }), 200

@app.route('/encode', methods=['POST'])
def encode_sentences():
    """
    API endpoint to encode a list of sentences into embeddings.
    Expects a JSON payload with a 'sentences' key containing a list of strings.
    """
    logger.info("=== ENCODE ENDPOINT CALLED ===")
    
    try:
        # Check if model is loaded
        if not model_loaded:
            logger.error("Model not loaded")
            return jsonify({"error": "Model not loaded"}), 500
        
        # Get JSON data
        data = request.get_json()
        logger.info(f"Received data: {data}")
        
        if not data or 'sentences' not in data or not isinstance(data['sentences'], list):
            logger.error("Invalid input")
            return jsonify({"error": "Invalid input. Please provide a JSON object with a 'sentences' key containing a list of strings."}), 400

        sentences = data['sentences']
        logger.info(f"Processing {len(sentences)} sentences")
        
        # Generate embeddings
        embeddings = model.encode(sentences).tolist()  # Convert numpy array to list for JSON serialization
        logger.info(f"Generated embeddings successfully")
        
        return jsonify({"embeddings": embeddings}), 200
        
    except Exception as e:
        logger.error(f"Error in encode_sentences: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start model loading in background thread
    logger.info("Starting simple vector-convert-llm service...")
    model_thread = threading.Thread(target=load_model_async, daemon=True)
    model_thread.start()
    
    # Run the app
    logger.info("Service starting on port 8082...")
    app.run(host='0.0.0.0', port=8082, debug=True, threaded=True)