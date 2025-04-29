from django.urls import path, include
from .views import (
    DashboardDataView,
    UserView,
    TransactionView,
    MonthlyTransactionsView,
    NotificationView,
    BudgetView,
    ReportView,
    ChatbotView,
    UserRegistrationView,
    CustomTokenObtainPairView,
    ForgotPasswordView,
    CommentView,
    predict_category,
    TransactionCategoriesView,
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('user/', UserView.as_view(), name='user'),
    path('transactions/', TransactionView.as_view(), name='transactions'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('comments/', CommentView.as_view(), name='comments'),
    path('dashboard/', DashboardDataView.as_view(), name='dashboard'),
    path('notifications/', NotificationView.as_view(), name='notifications'),
    path('transactions/monthly/', MonthlyTransactionsView.as_view(), name='monthly-transactions'),
    path('transactions/<int:pk>/', TransactionView.as_view(), name='transaction-detail'),
    path('transaction-categories/', TransactionCategoriesView.as_view(), name='transaction-categories'),
    path('notifications/<int:pk>/', NotificationView.as_view(), name='notification-detail'),
    path('budgets/', BudgetView.as_view(), name='budgets'),
    path('reports/', ReportView.as_view(), name='reports'),
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
    path('categorize/', predict_category, name='predict_category'),
]
# Combine all API paths into a single urlpatterns list
urlpatterns += [
    path('api/', include(urlpatterns)),
]