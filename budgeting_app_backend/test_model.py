# budgeting_app_backend/test_model.py
import os
import django
import pandas as pd
import joblib

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budgeting_app_backend.settings')
django.setup()

def test_prediction():
    # 1. Load the trained model
    model_path = 'api/ml/models/transaction_classifier_v1.joblib'
    model = joblib.load(model_path)
    
    # 2. Create test data (as DataFrame)
    test_data = pd.DataFrame([{
        'description': 'dinner at restaurant',
        'amount': 75.00,
        'has_amount': 1,
        'day_of_week': 4  # Thursday
    }])
    
    # 3. Make prediction
    prediction = model.predict(test_data)
    probabilities = model.predict_proba(test_data)
    
    print("Test Prediction Results:")
    print(f"Predicted Category: {prediction[0]}")
    print("All Probabilities:")
    for category, prob in zip(model.named_steps['classifier'].classes_, probabilities[0]):
        print(f"{category}: {prob:.2f}")

if __name__ == '__main__':
    test_prediction()