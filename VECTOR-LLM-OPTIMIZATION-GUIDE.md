# Vector LLM Memory Optimization Guide

## Problem Summary

Your vector-convert-llm Docker container was experiencing SIGSEGV (segmentation fault) errors despite having 8GB of RAM allocated. This was caused by:

1. **Multi-threading conflicts** with PyTorch/NumPy in Gunicorn
2. **Memory fragmentation** from large batch processing
3. **Fork-based multiprocessing** issues with ML libraries
4. **Inefficient memory management** during document chunking

## Solution Overview

I've created an optimized version that addresses these issues:

### Key Optimizations

1. **Single Worker Configuration**
   - Changed from multiple workers/threads to single worker, single thread
   - Eliminates fork-based multiprocessing conflicts
   - Reduces memory overhead

2. **Memory Management**
   - Aggressive garbage collection after operations
   - Smaller chunk sizes (500 chars vs 1000)
   - Limited batch processing (1 chunk at a time)
   - Memory cleanup every 10 operations

3. **CPU-Only PyTorch**
   - Uses CPU-only PyTorch to reduce memory footprint
   - Eliminates GPU memory allocation attempts

4. **Optimized Model**
   - Switched to `BAAI/bge-small-en` (smaller, more efficient)
   - Pre-loaded at build time to avoid runtime issues

5. **Environment Variables**
   - Set thread limits for all math libraries
   - Disabled tokenizer parallelism
   - Optimized Python settings

## Files Created

### 1. `apps/vector-convert-llm/optimized.Dockerfile`
- Memory-optimized Docker configuration
- CPU-only PyTorch installation
- Pre-loaded model at build time

### 2. `apps/vector-convert-llm/optimized-main.py`
- Simplified Flask application
- Aggressive memory management
- Single-threaded processing
- Better error handling

### 3. `apps/vector-convert-llm/optimized-requirements.txt`
- CPU-only PyTorch versions
- Stable dependency versions
- Reduced package footprint

### 4. `docker-compose.yml` (updated)
- Reduced memory allocation (4GB limit, 2GB reservation)
- Optimized environment variables
- Extended health check timeouts

### 5. `deploy-optimized-llm.sh`
- Automated deployment script
- Health checking and testing
- Memory usage monitoring

## Deployment Instructions

### Step 1: Deploy the Optimized Version
```bash
./deploy-optimized-llm.sh
```

This script will:
- Stop the existing service
- Clean up old images
- Build and deploy the optimized version
- Wait for health checks to pass
- Test the endpoints
- Show memory usage

### Step 2: Monitor Performance
```bash
# Check service status
docker-compose ps vector-convert-llm

# Monitor memory usage
docker stats vector-convert-llm

# View logs
docker-compose logs -f vector-convert-llm
```

### Step 3: Test Functionality
```bash
# Test health endpoint
curl http://localhost:8081/health

# Test embedding generation
curl -X POST http://localhost:8081/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "test sentence"}'
```

## Memory Usage Comparison

| Configuration | Memory Limit | Expected Usage | Workers | Threads |
|---------------|--------------|----------------|---------|---------|
| **Original**  | 8GB          | 6-8GB          | 1       | 4       |
| **Optimized** | 4GB          | 2-3GB          | 1       | 1       |

## Key Differences

### Original Issues:
- Multi-threaded Gunicorn with PyTorch conflicts
- Large chunk sizes causing memory spikes
- Background threading for model loading
- GPU-enabled PyTorch (unnecessary overhead)

### Optimized Solutions:
- Single-threaded synchronous processing
- Smaller chunks with aggressive cleanup
- Synchronous model loading at startup
- CPU-only PyTorch with thread limits

## Troubleshooting

### If the service still crashes:

1. **Check Docker logs:**
   ```bash
   docker-compose logs vector-convert-llm
   ```

2. **Reduce memory further:**
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 3G
       reservations:
         memory: 1.5G
   ```

3. **Monitor memory usage:**
   ```bash
   docker stats --no-stream vector-convert-llm
   ```

4. **Test with smaller documents:**
   - The optimized version limits chunks to 20 per document
   - Chunk size is reduced to 500 characters

### If performance is too slow:

1. **Increase chunk size (carefully):**
   ```python
   # In optimized-main.py
   MAX_CHUNK_SIZE = 750  # Increase from 500
   ```

2. **Process more chunks in parallel:**
   ```python
   # In optimized-main.py
   MAX_BATCH_SIZE = 2  # Increase from 1
   ```

3. **Reduce garbage collection frequency:**
   ```python
   # In optimized-main.py
   MEMORY_CLEANUP_INTERVAL = 20  # Increase from 10
   ```

## Monitoring Commands

```bash
# Real-time memory monitoring
watch -n 5 'docker stats --no-stream vector-convert-llm'

# Service health check
watch -n 10 'curl -s http://localhost:8081/health | jq'

# Log monitoring
docker-compose logs -f --tail=50 vector-convert-llm
```

## Rollback Instructions

If you need to rollback to the original version:

```bash
# Stop optimized version
docker-compose stop vector-convert-llm

# Update docker-compose.yml to use original Dockerfile
# Change: dockerfile: optimized.Dockerfile
# To: dockerfile: Dockerfile

# Rebuild and restart
docker-compose build vector-convert-llm
docker-compose up -d vector-convert-llm
```

## Performance Expectations

With the optimized version, you should see:
- **Memory usage**: 2-3GB instead of 6-8GB
- **Startup time**: 60-120 seconds (model pre-loading)
- **Processing speed**: Slightly slower but more stable
- **Error rate**: Significantly reduced SIGSEGV errors

The trade-off is slightly slower processing for much better stability and memory efficiency.
