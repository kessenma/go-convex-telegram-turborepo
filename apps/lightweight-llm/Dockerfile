# Runtime model loading - no model baking
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MODELS_DIR=/models
ENV HF_CACHE_DIR=/root/.cache/huggingface
ENV N_CTX=4096
ENV N_THREADS=8
ENV N_GPU_LAYERS=0
ENV PORT=8082
ENV DOCKER_CONTAINER=true
ENV DEFAULT_MODEL=meta-llama/Llama-3.2-1B-Instruct

# Install system dependencies required for llama-cpp-python and huggingface-hub
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    build-essential \
    python3-dev \
    cmake \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy pyproject.toml for dependency installation
COPY pyproject.toml ./

# Install Python dependencies using uv
RUN uv pip install --system .

# Create models directory for runtime model loading
RUN mkdir -p /models

# Copy the application code
COPY main.py .
COPY config.py .
COPY model_manager.py .
COPY chat_handler.py .
COPY status_reporter.py .
COPY rag_processor.py .
COPY quantitative_rag.py .
COPY qualitative_rag.py .
COPY langextract_rag.py .
COPY install_langextract.py .
COPY conversation_title.py .

# Expose the port the app runs on
EXPOSE 8082

# Health check with longer start period for model loading
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:8082/health || exit 1

# Run the application
CMD ["python", "main.py"]
