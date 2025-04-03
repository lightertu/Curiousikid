# Use a minimal base image with Python 3.10 (can use other versions as needed)
FROM python:3.10-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies, including ffmpeg which is required for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy pyproject.toml and other necessary files
COPY pyproject.toml .
COPY uv.lock .
COPY setup.sh .
COPY justfile .

# Install pip-tools and dependencies
RUN pip install --no-cache-dir pip-tools uv

# Install dependencies using uv (faster and more lightweight than pip)
RUN python -m uv pip install -e .

# Copy only necessary files
COPY src/ /app/src/
COPY .env /app/.env

# Create a non-root user to run the application
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser

# Command to run the voice agent
CMD ["python", "-m", "src.voice_agent.agent.entrypoint"]
