#!/bin/bash
poetry install --no-interaction --no-ansi
python manage.py collectstatic --no-input
python manage.py migrate