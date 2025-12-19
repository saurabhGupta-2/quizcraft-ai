FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for ChromaDB)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from your backend/requirements folder
COPY requirements/ /app/requirements/

# Install dependencies
RUN pip install --no-cache-dir -r /app/requirements/prod.txt

# Copy the rest of the backend code
COPY . .

# Create data directory for ChromaDB (Crucial for persistence)
RUN mkdir -p /app/data/chromadb

# Railway uses the PORT variable automatically
EXPOSE 8000

# Using a more direct CMD structure
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}