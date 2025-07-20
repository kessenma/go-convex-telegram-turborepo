# Stage 1: Build stage with secret to download the model
FROM python:3.11-slim AS builder

WORKDIR /app

# Install huggingface-hub for model downloading
RUN pip install huggingface-hub>=0.17.1

# Set the environment variable for the huggingface-cli
ENV HUGGINGFACE_HUB_ADD_TOKEN_AS_GIT_CREDENTIAL=false

# Use ARG to pass the secret token for use only during the build
ARG HF_AUTH_TOKEN

# Download a compatible GGUF model
# Using Llama-3.2-1B which is well supported by llama-cpp-python
RUN echo "Downloading Llama-3.2-1B model for better compatibility..."; \
    huggingface-cli download bartowski/Llama-3.2-1B-Instruct-GGUF Llama-3.2-1B-Instruct-Q4_K_M.gguf --local-dir . --local-dir-use-symlinks False && \
    mv Llama-3.2-1B-Instruct-Q4_K_M.gguf Phi-3-mini-4k-instruct-q4.gguf

# Stage 2: Final image without secrets
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MODEL_PATH=./Phi-3-mini-4k-instruct-q4.gguf
ENV N_CTX=4096
ENV N_THREADS=8
ENV N_GPU_LAYERS=0
ENV PORT=8082

# Install system dependencies required for llama-cpp-python
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    build-essential \
    python3-dev \
    cmake \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --timeout 600 -r requirements.txt

# Copy the downloaded model from the builder stage
COPY --from=builder /app/Phi-3-mini-4k-instruct-q4.gguf .

# Copy the application code
COPY main.py .

# Expose the port the app runs on
EXPOSE 8082

# Health check with longer start period for model loading
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:8082/health || exit 1

# Run the application
CMD ["python", "main.py"]
