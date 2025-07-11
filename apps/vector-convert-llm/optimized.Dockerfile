FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables for better memory management
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TRANSFORMERS_CACHE=/app/cache/transformers
ENV HF_HOME=/app/cache/huggingface
ENV TOKENIZERS_PARALLELISM=false
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1

# Create cache directory
RUN mkdir -p /app/cache/transformers /app/cache/huggingface

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY optimized-requirements.txt requirements.txt

# Install Python dependencies with specific versions for stability
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the model at build time to avoid runtime issues
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en')"

# Copy application code
COPY optimized-main.py main.py

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Use single worker, single thread to avoid memory conflicts
# Increased timeout for model loading, disable preload to avoid startup issues
CMD ["gunicorn", "--worker-class", "sync", "--workers", "1", "--threads", "1", "--bind", "0.0.0.0:8081", "--timeout", "600", "--graceful-timeout", "600", "main:app"]
