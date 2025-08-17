FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Set working directory
WORKDIR /app

# Set environment variables for maximum stability
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
    python3-dev \
    netcat-openbsd \
    dnsutils \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better caching
COPY pyproject.toml .

# Extract dependencies and install using uv
RUN python3 -c "import tomllib; f=open('pyproject.toml','rb'); data=tomllib.load(f); f.close(); deps=data['project']['dependencies']; [print(dep) for dep in deps]" > /tmp/requirements.txt && \
    uv pip install --system -r /tmp/requirements.txt

# Copy application code
COPY main.py .
COPY status_reporter.py .
COPY test_connection.py .
COPY debug_connectivity.sh .
COPY startup.sh .

# Make scripts executable
RUN chmod +x debug_connectivity.sh startup.sh

# Expose port
EXPOSE 7999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7999/health || exit 1

# Use startup script for better debugging and connectivity checking
CMD ["./startup.sh"]
