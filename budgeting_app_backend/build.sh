#!/bin/bash
set -o errexit

# Install Poetry if not present
if ! command -v poetry &> /dev/null; then
    pip install poetry
fi

# Configure Poetry to create virtualenvs in project
poetry config virtualenvs.in-project true

# Install dependencies
poetry install --no-interaction --no-ansi --with dev

# Collect static files
poetry run python manage.py collectstatic --no-input

# Apply database migrations
poetry run python manage.py migrate