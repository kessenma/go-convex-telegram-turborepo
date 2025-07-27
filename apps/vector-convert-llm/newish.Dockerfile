FROM python:3.11

# Set working directory
WORKDIR /app

# Configure transformers cache directory so model persists in image
ENV TRANSFORMERS_CACHE=/app/cache/transformers
ENV HF_HOME=/app/cache/huggingface
# Create cache directory
RUN mkdir -p /app/cache/transformers /app/cache/huggingface
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with retry logic
RUN pip install --no-cache-dir --retries 3 --timeout 60 -r requirements.txt

# Pre-download the SentenceTransformers model at build time to avoid runtime download issues
RUN python -c 'from sentence_transformers import SentenceTransformer; SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")'

# Copy application code
COPY . .

# Expose port
EXPOSE 7999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7999/health || exit 1

# Run the application with Gunicorn preloading to ensure background threads start before forking workers
CMD ["gunicorn", "-w", "1", "--threads", "1", "-b", "0.0.0.0:7999", "main:app"]
