# Use a minimal base image with Python 3.10 (can use other versions as needed)
FROM python:3.10-slim-bullseye

# Set environment variables to make Python behave in a more container-friendly way
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies, including ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    llvm \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the container
COPY ./requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the application code to the container
COPY . /app

# Expose the port that FastAPI will run on (optional, depending on how you set up the server)
EXPOSE 8000

# Command to run FastAPI server with Uvicorn (add additional performance settings as needed)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
