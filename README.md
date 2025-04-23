BudgetBuddy.

BudgetBuddy is my personal finance management application designed to help users track their spending, set budgets, and gain insights into their financial habits. Built with Django for the backend and React for the frontend, it offers a seamless user experience with features like transaction categorization, budget tracking, and AI-driven financial suggestions.

The backend is structured to handle data processing, machine learning, and API management. I implemented data_preprocessor.py to clean and engineer transaction features, model_trainer.py to train a HistGradientBoostingClassifier for automatic transaction categorization, and predictor.py to serve real-time predictions. Django models (Transaction, Budget, SavingsGoal, etc.) define the database schema, while serializers ensure proper data validation and transformation. Views handle API logic for user interactions, and Celery automates periodic model retraining to maintain accuracy.

On the frontend, React components like BudgetForm, TransactionsTable, and ChartsSection create an intuitive interface. The dashboard aggregates financial data into visual summaries, while the AI-assisted TransactionForm simplifies categorization. Notifications alert users to overspending or upcoming bills, and the ProfileSection allows personalization.

PROJECT URL:
https://budgetbuddy-frontend-nyw4.onrender.com


BudgetBuddy Project Documentation:
https://docs.google.com/document/d/1cLlX5v7nDnem4yNUY1Lj9hmKe82k72ZP/edit?usp=sharing&ouid=116384469025343273414&rtpof=true&sd=true
