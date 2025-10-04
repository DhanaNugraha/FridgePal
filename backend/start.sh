#!/bin/bash

# Exit on error
set -e

# Run database migrations (if any)
# echo "Running migrations..."
# alembic upgrade head

# Start the application
echo "Starting application..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
