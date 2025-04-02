# api/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from .ml.model_trainer import train_model
import mlflow

@shared_task
def retrain_model_task():
    """Celery task for periodic model retraining"""
    try:
        with mlflow.start_run(run_name="Scheduled Retraining"):
            model = train_model()
            mlflow.log_param("trigger", "scheduled")
            return "Model retrained successfully"
    except Exception as e:
        return f"Retraining failed: {str(e)}"