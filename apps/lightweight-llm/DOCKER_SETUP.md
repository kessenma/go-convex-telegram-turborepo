# Docker Setup for Lightweight LLM

This document explains how to build and run the Lightweight LLM service in Docker with the new LangExtract integration.

## Quick Start

### 1. Build the Docker Image

```bash
cd apps/lightweight-llm
docker build -t lightweight-llm:latest .
```

### 2. Run with Docker Compose

```bash
# From the project root
docker-compose up lightweight-llm
```

### 3. Run Standalone Container

```bash
# Basic run (without LangExtract)
docker run -p 8082:8082 lightweight-llm:latest

# With LangExtract enabled (slower startup but enhanced features)
docker run -p 8082:8082 -e INSTALL_LANGEXTRACT=true lightweight-llm:latest
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8082` | Port the service runs on |
| `MODEL_PATH` | `./Phi-3-mini-4k-instruct-q4.gguf` | Path to the GGUF model file |
| `N_CTX` | `4096` | Context window size |
| `N_THREADS` | `8` | Number of CPU threads |
| `N_GPU_LAYERS` | `0` | Number of GPU layers (0 for CPU-only) |
| `INSTALL_LANGEXTRACT` | `false` | Install LangExtract for enhanced RAG |
| `CONVEX_URL` | `http://localhost:3001` | Convex backend URL |

### Docker Compose Configuration

The service is configured in `docker-compose.yaml` with:

- **Memory Limits**: 6GB limit, 3GB reservation
- **Health Checks**: Automatic health monitoring
- **Network**: Connected to `telegram-bot-network`
- **Dependencies**: Waits for Convex backend

## LangExtract Integration

### Without LangExtract (Default)
- Faster startup time
- Basic RAG query classification
- Regex-based entity extraction
- Fallback processing for all queries

### With LangExtract (Optional)
- Slower startup (additional package installation)
- Advanced query classification with confidence scores
- Structured entity extraction
- Enhanced RAG processing with metadata

To enable LangExtract:

```bash
# In docker-compose.yaml
environment:
  - INSTALL_LANGEXTRACT=true

# Or standalone
docker run -e INSTALL_LANGEXTRACT=true lightweight-llm:latest
```

## Testing

### Automated Testing

```bash
# Run the build and test script
./build_and_test.sh
```

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:8082/health
   ```

2. **Model Information**
   ```bash
   curl http://localhost:8082/model-info
   ```

3. **Query Classification**
   ```bash
   curl -X POST http://localhost:8082/classify-query \
     -H "Content-Type: application/json" \
     -d '{"query": "How much revenue did we generate?"}'
   ```

4. **Chat Endpoint**
   ```bash
   curl -X POST http://localhost:8082/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What is the company strategy?",
       "context": "The company focuses on digital transformation and customer experience.",
       "max_length": 256
     }'
   ```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   - Ensure all Python files are copied in Dockerfile
   - Check that the build context includes all necessary files

2. **Model Loading Failures**
   - Verify the model file exists and is accessible
   - Check memory allocation (model needs ~2-3GB)
   - Review Docker logs for specific error messages

3. **LangExtract Installation Issues**
   - Installation adds ~30-60 seconds to startup time
   - Check logs for pip installation errors
   - Fallback processing will be used if installation fails

4. **Health Check Failures**
   - Increase `start_period` in health check if model loading is slow
   - Check port binding and firewall settings
   - Verify Convex backend connectivity

### Debugging

1. **View Container Logs**
   ```bash
   docker logs lightweight-llm
   ```

2. **Interactive Shell**
   ```bash
   docker run -it --entrypoint /bin/bash lightweight-llm:latest
   ```

3. **Check File Permissions**
   ```bash
   docker run --rm lightweight-llm:latest ls -la /app/
   ```

### Performance Tuning

1. **Memory Allocation**
   - Minimum: 3GB for basic operation
   - Recommended: 6GB for optimal performance
   - Adjust `NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM` in docker-compose

2. **CPU Threads**
   - Default: 8 threads
   - Adjust `N_THREADS` based on available CPU cores
   - Match with `OMP_NUM_THREADS` and related variables

3. **Context Window**
   - Default: 4096 tokens
   - Reduce `N_CTX` if memory is limited
   - Increase for longer document processing

## Development

### Local Development

For development without Docker:

```bash
cd apps/lightweight-llm

# Install dependencies
pip install -r requirements.txt

# Optional: Install LangExtract
pip install langextract

# Run locally
python main.py
```

### Building Custom Images

```bash
# Build with custom tag
docker build -t my-lightweight-llm:v1.0 .

# Build with build args
docker build --build-arg HF_AUTH_TOKEN=your_token -t lightweight-llm:latest .
```

### File Structure

```
apps/lightweight-llm/
├── Dockerfile                 # Docker build configuration
├── docker_startup.py         # Container startup script
├── main.py                   # Main FastAPI application
├── requirements.txt          # Python dependencies
├── rag_processor.py          # Original RAG processor
├── quantitative_rag.py       # Quantitative query handling
├── qualitative_rag.py        # Qualitative query handling
├── langextract_rag.py        # LangExtract integration
├── status_reporter.py        # Status reporting to Convex
└── build_and_test.sh         # Build and test script
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and status |
| `/model-info` | GET | Model and system information |
| `/chat` | POST | Generate chat responses |
| `/classify-query` | POST | Classify query type |

## Monitoring

The service reports status to Convex backend:
- Startup notifications
- Health status updates
- Error reporting
- Performance metrics

Monitor through:
- Docker health checks
- Convex dashboard
- Application logs
- `/health` endpoint responses