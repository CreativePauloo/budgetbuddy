# api/management/commands/preprocess_data.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from django.core.management.base import BaseCommand
from api.models import Transaction
import os

class Command(BaseCommand):
    help = 'Preprocess transaction data for AI model training'

    def handle(self, *args, **kwargs):
        # Fetch transaction data from the database
        transactions = Transaction.objects.all().values('description', 'category')
        
        if not transactions:
            self.stdout.write(self.style.ERROR('No transaction data found'))
            return
            
        df = pd.DataFrame(list(transactions))
        
        # Check if we have enough categories
        unique_categories = df['category'].nunique()
        if unique_categories < 2:
            self.stdout.write(self.style.ERROR(
                f'Need at least 2 transaction categories, found {unique_categories}'
            ))
            return

        # Encode the category labels
        label_encoder = LabelEncoder()
        df['category_encoded'] = label_encoder.fit_transform(df['category'])

        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            df['description'], 
            df['category_encoded'], 
            test_size=0.2, 
            random_state=42
        )

        # Define the path to save the preprocessed data
        base_path = os.path.join(os.path.dirname(__file__), '..', '..', 'utils')
        os.makedirs(base_path, exist_ok=True)
        
        # Save the data
        X_train.to_csv(os.path.join(base_path, 'X_train.csv'), index=False)
        y_train.to_csv(os.path.join(base_path, 'y_train.csv'), index=False)
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully preprocessed data with {unique_categories} categories'
        ))