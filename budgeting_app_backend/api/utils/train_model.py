# train_model.py (optimized for very small datasets)
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
import joblib
import os
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings('ignore')  # Suppress warnings for small dataset

def train_with_minimal_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    try:
        # Load data
        X = pd.read_csv(os.path.join(script_dir, 'X_train.csv'))
        y = pd.read_csv(os.path.join(script_dir, 'y_train.csv'))
        
        # Extreme minimal data handling
        if len(X) < 3:
            raise ValueError("Need at least 3 samples to create any meaningful model")
            
        # Use all data for training (no validation split)
        text_data = X['description']
        labels = y['category_encoded']
        
        # Simplified pipeline
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                min_df=1,  # Allow all terms
                max_features=50  # Very small vocabulary
            )),
            ('clf', LinearSVC(
                class_weight='balanced',  # Critical for tiny datasets
                dual=False,  # Better for small feature spaces
                max_iter=1000  # Ensure convergence
            ))
        ])
        
        # Train on all available data
        pipeline.fit(text_data, labels)
        
        # Quick sanity check (training accuracy)
        predictions = pipeline.predict(text_data)
        accuracy = accuracy_score(labels, predictions)
        print(f"\nTraining Accuracy: {accuracy:.0%}")
        print("Sample Predictions:")
        for text, pred, actual in zip(text_data[:5], predictions[:5], labels[:5]):
            print(f"'{text}' -> Predicted: {pred}, Actual: {actual}")
        
        # Save model
        model_path = os.path.join(script_dir, 'mini_transaction_classifier.pkl')
        joblib.dump(pipeline, model_path)
        print(f"\nModel saved to: {model_path}")
        
        # Show dataset info
        print("\n=== Dataset Info ===")
        print(f"Total samples: {len(X)}")
        print("Class distribution:")
        print(y['category_encoded'].value_counts())
        
    except Exception as e:
        print(f"\nERROR: {str(e)}")

if __name__ == "__main__":
    train_with_minimal_data()