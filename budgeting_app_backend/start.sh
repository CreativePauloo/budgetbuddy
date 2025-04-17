#!/bin/bash
set -o errexit

# Activate the virtual environment
source .venv/bin/activate

# Run migrations
python manage.py migrate

# Start Gunicorn
exec gunicorn budgeting_app_backend.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 4 \
    --timeout 120 \
    --log-level debug