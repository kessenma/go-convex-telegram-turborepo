FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TRANSFORMERS_CACHE=/app/cache/transformers
ENV HF_HOME=/app/cache/huggingface
ENV TOKENIZERS_PARALLELISM=false
ENV PYTORCH_TRANSFORMERS_CACHE=/app/cache/transformers
ENV TRANSFORMERS_OFFLINE=0

# Create cache directory with proper permissions
RUN mkdir -p /app/cache/transformers /app/cache/huggingface && \
    chmod -R 755 /app/cache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    build-essential \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with better error handling
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --timeout 300 -r requirements.txt

# Copy application code
COPY main.py .

# Create a script to pre-download the smaller model
RUN echo '#!/usr/bin/env python3\n\
import os\n\
from transformers import AutoTokenizer, AutoModelForCausalLM\n\
print("Pre-downloading model...")\n\
try:\n\
    tokenizer = AutoTokenizer.from_pretrained(\n\
        "microsoft/DialoGPT-small",\n\
        cache_dir="/app/cache/transformers",\n\
        trust_remote_code=True\n\
    )\n\
    model = AutoModelForCausalLM.from_pretrained(\n\
        "microsoft/DialoGPT-small",\n\
        cache_dir="/app/cache/transformers",\n\
        trust_remote_code=True,\n\
        torch_dtype="auto"\n\
    )\n\
    print("Model pre-download completed successfully")\n\
except Exception as e:\n\
    print(f"Model pre-download failed: {e}")\n\
    # Do not fail the build, let the app handle it at runtime\n\
' > /app/preload_model.py && \
    python /app/preload_model.py || echo "Model preload failed, will download at runtime"

# Expose port
EXPOSE 8082

# Health check with longer start period for model loading
HEALTHCHECK --interval=30s --timeout=15s --start-period=300s --retries=5 \
    CMD curl -f http://localhost:8082/health || exit 1

# Run the application
CMD ["python", "main.py"]
