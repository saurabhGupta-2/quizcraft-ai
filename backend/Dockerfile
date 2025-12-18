FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements directory
COPY requirements/ /app/requirements/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/requirements/prod.txt

# Copy application code
COPY app/ ./app/

# Create data directory for ChromaDB
RUN mkdir -p /app/data/chromadb

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]