#api/ml/predictor.py
import joblib
from django.conf import settings

class TransactionClassifier:
    def __init__(self):
        model_path = settings.BASE_DIR / "api/ml/models/transaction_classifier_v1.joblib"
        self.model = joblib.load(model_path)
        self.classes = self.model.named_steps['classifier'].classes_
    
    def predict(self, description, amount, date):
        features = {
            'description': description,
            'amount': float(amount),
            'has_amount': 1 if float(amount) > 100 else 0,
            'day_of_week': date.weekday()  # Monday=0, Sunday=6
        }
        return self.model.predict([features])[0], self.model.predict_proba([features])[0]