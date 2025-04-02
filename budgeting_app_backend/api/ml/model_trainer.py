#api/ml/model_trainer.py
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import FunctionTransformer
import mlflow
import joblib
import os
import django
import numpy as np
from scipy.sparse import issparse

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budgeting_app_backend.settings')
django.setup()

from .data_preprocessor import create_training_data

def to_dense(X):
    """Convert sparse matrix to dense if needed"""
    if issparse(X):
        return X.toarray()
    return X

def numeric_to_array(X):
    """Convert numeric DataFrame to numpy array"""
    return X.values

def train_model():
    df = create_training_data()
    
    if len(df) == 0:
        raise ValueError("No training data available")
    
    # Separate features
    text_features = ['description']
    numeric_features = ['amount', 'has_amount', 'day_of_week']
    
    # Create transformers
    text_transformer = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=500,
            stop_words='english'
        )),
        ('to_dense', FunctionTransformer(to_dense))
    ])
    
    numeric_transformer = Pipeline([
        ('to_array', FunctionTransformer(numeric_to_array))
    ])
    
    # Combine features
    preprocessor = ColumnTransformer([
        ('text', text_transformer, 'description'),
        ('numeric', numeric_transformer, numeric_features)
    ])
    
    # Final pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', HistGradientBoostingClassifier(
            max_iter=100,
            categorical_features=[len(numeric_features)-1]  # Only day_of_week is categorical
        ))
    ])
    
    X = df.drop('category', axis=1)
    y = df['category']
    
    with mlflow.start_run():
        pipeline.fit(X, y)
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, 'transaction_classifier_v1.joblib')
        joblib.dump(pipeline, model_path)
        
        print(f"Model saved to: {model_path}")
        return pipeline