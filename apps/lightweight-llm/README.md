# Lightweight LLM Service

A lightweight self-hosted LLM service for document chat using Microsoft's Phi-3-mini model.

## Features

- **Lightweight Model**: Uses Microsoft Phi-3-mini-4k-instruct (3.8B parameters)
- **Memory Efficient**: 4-bit quantization for reduced memory usage
- **Fast API**: FastAPI-based REST API
- **Document Context**: Optimized for RAG (Retrieval-Augmented Generation)
- **Conversation History**: Maintains context across multiple turns

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status and memory usage.

### Chat
```
POST /chat
```
Generate responses based on user messages and document context.

**Request Body:**
```json
{
  "message": "What is the main topic?",
  "context": "Document content here...",
  "conversation_history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "max_length": 512,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "response": "Generated response text",
  "model_info": {
    "model_name": "microsoft/Phi-3-mini-4k-instruct",
    "device": "cuda",
    "max_length": 512,
    "temperature": 0.7
  },
  "usage": {
    "input_tokens": 150,
    "output_tokens": 75,
    "total_tokens": 225
  }
}
```

### Model Info
```
GET /model-info
```
Returns detailed information about the loaded model.

## Environment Variables

- `PORT`: Service port (default: 8082)
- `TRANSFORMERS_CACHE`: Model cache directory
- `HF_HOME`: Hugging Face cache directory
- `TOKENIZERS_PARALLELISM`: Set to false to avoid warnings

## Memory Requirements

- **Minimum**: 2GB RAM
- **Recommended**: 4GB RAM
- **GPU**: Optional (CUDA support for faster inference)

## Model Details

- **Model**: microsoft/Phi-3-mini-4k-instruct
- **Parameters**: 3.8B
- **Context Length**: 4K tokens
- **Quantization**: 4-bit (when GPU available)
- **Optimization**: Optimized for document Q&A tasks

## Integration

This service is designed to work with the RAG chat system:

1. Documents are processed and embedded by the vector-convert-llm service
2. Relevant chunks are retrieved based on user queries
3. This service generates natural language responses using the retrieved context
4. Responses are displayed in the web interface with source citations

## Performance

- **Startup Time**: ~60-120 seconds (model loading)
- **Response Time**: 1-5 seconds per response
- **Throughput**: Optimized for single-user scenarios
- **Memory Usage**: ~2-4GB depending on quantization

## Docker

The service runs in a Docker container with:
- Python 3.11 slim base image
- Automatic model downloading and caching
- Health checks for container orchestration
- Resource limits for stable operation