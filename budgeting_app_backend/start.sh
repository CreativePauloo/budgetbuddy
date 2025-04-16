#!/usr/bin/env bash
set -o errexit

# Run migrations
python manage.py migrate

# Start Gunicorn
poetry run gunicorn budgeting_app_backend.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 4 \
  --timeout 120