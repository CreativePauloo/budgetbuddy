import pandas as pd
from sklearn.preprocessing import FunctionTransformer
from api.models import Transaction

def create_training_data():
    transactions = Transaction.objects.all().values(
        'description', 
        'amount', 
        'category',
        'date'
    )
    df = pd.DataFrame(list(transactions))
    
    # Advanced feature engineering
    df['has_amount'] = df['amount'].apply(lambda x: 1 if x > 100 else 0)
    df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
    df['description_length'] = df['description'].str.len()
    
    return df[['description', 'amount', 'has_amount', 'day_of_week', 'description_length', 'category']]