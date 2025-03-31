from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Transaction, SavingsGoal, Notification, Budget, Comment
from .serializers import (
    UserSerializer, 
    TransactionSerializer,
    SavingsGoalSerializer,
    NotificationSerializer,
    BudgetSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    CommentSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
import json
from reportlab.pdfgen import canvas
from io import BytesIO
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import joblib
import os

# Load the model when the server starts
try:
    model_path = os.path.join(settings.BASE_DIR, 'api', 'utils', 'transaction_classifier.pkl')
    model = joblib.load(model_path)
    print(f"Model loaded successfully from {model_path}")  # Debug print
except Exception as e:
    print(f"Error loading model: {str(e)}")  # Debug print
    model = None

@api_view(['POST'])
def categorize_transaction(request):
    if not model:
        return Response({'error': 'Model not loaded'}, status=503)
    
    description = request.data.get('description', '')
    if not description:
        return Response({'error': 'Description required'}, status=400)
    
    try:
        # Predict category
        category_encoded = model.predict([description])[0]
        category = model.named_steps['clf'].classes_[category_encoded]
        return Response({'category': category})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Transactions data
        transactions = Transaction.objects.filter(user=request.user)
        income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
        expenses = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Savings goal
        savings_goal, created = SavingsGoal.objects.get_or_create(
            user=request.user,
            defaults={
                'target_amount': 1000,
                'current_amount': 0
            }
        )
        
        # Recent transactions
        recent_transactions = Transaction.objects.filter(
            user=request.user
        ).order_by('-date')[:5]
        
        # Check for upcoming bills
        upcoming_bills = Transaction.objects.filter(
            user=request.user,
            type='expense',
            description__icontains='bill',
            date__gte=timezone.now(),
            date__lte=timezone.now() + timedelta(days=7)
        )
        
        # Create notification for upcoming bills if needed
        if upcoming_bills.exists() and not Notification.objects.filter(
            user=request.user,
            title__icontains='Upcoming Bill',
            is_read=False
        ).exists():
            Notification.objects.create(
                user=request.user,
                title='Upcoming Bill',
                message=f"You have {upcoming_bills.count()} bill(s) due this week",
                notification_type='reminder'
            )
        
        # Check for overspending
        monthly_budget = 2000  # Default, could come from user settings
        current_month_expenses = Transaction.objects.filter(
            user=request.user,
            type='expense',
            date__month=timezone.now().month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if current_month_expenses > monthly_budget * 0.8 and not Notification.objects.filter(
            user=request.user,
            title__icontains='Overspending Alert',
            is_read=False
        ).exists():
            Notification.objects.create(
                user=request.user,
                title='Overspending Alert',
                message=f"You've spent {current_month_expenses/monthly_budget*100:.0f}% of your monthly budget",
                notification_type='warning'
            )
        
        # Get notifications after potential creations
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).order_by('-created_at')[:5]
        
        data = {
            'income': income,
            'expenses': expenses,
            'savings_goal': SavingsGoalSerializer(savings_goal).data,
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
            'notifications': NotificationSerializer(notifications, many=True).data,
        }
        
        return Response(data)

class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TransactionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        # Ensure date is set if not provided
        if 'date' not in request.data or not request.data['date']:
            request.data['date'] = timezone.now().date().isoformat()
        
        serializer = TransactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, pk):
        try:
            transaction = Transaction.objects.get(pk=pk, user=request.user)
            serializer = TransactionSerializer(transaction, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Transaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            transaction = Transaction.objects.get(pk=pk, user=request.user)
            transaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Transaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
class TransactionCategoriesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transaction_type = request.query_params.get('type', 'expense')
        
        if transaction_type == 'income':
            categories = Transaction.INCOME_CATEGORIES
        else:
            categories = Transaction.EXPENSE_CATEGORIES
        
        return Response({
            'type': transaction_type,
            'categories': [{'value': c[0], 'label': c[1]} for c in categories]
        })
        
class MonthlyTransactionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get monthly income and expenses for the last 6 months
        today = timezone.now()
        months = []
        
        for i in range(6):
            month = today - timedelta(days=30*i)
            month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            income = Transaction.objects.filter(
                user=request.user,
                type='income',
                date__gte=month_start,
                date__lte=month_end
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            expenses = Transaction.objects.filter(
                user=request.user,
                type='expense',
                date__gte=month_start,
                date__lte=month_end
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            months.append({
                'month': month_start.strftime('%b %Y'),
                'income': float(income),
                'expenses': float(expenses)
            })
        
        return Response(months[::-1])  # Reverse to show oldest first

class NotificationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    def patch(self, request, pk):
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

class BudgetView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        budgets = Budget.objects.filter(user=request.user)
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id
        serializer = BudgetSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        report_type = request.query_params.get('type', 'monthly')
        
        # Create PDF report
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        
        # Add content to PDF
        p.drawString(100, 800, f"BudgetBuddy Financial Report - {report_type.capitalize()}")
        p.drawString(100, 780, f"Generated for: {request.user.username}")
        p.drawString(100, 760, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        
        # Add transaction summary
        transactions = Transaction.objects.filter(user=request.user)
        if report_type == 'monthly':
            transactions = transactions.filter(date__month=timezone.now().month)
        elif report_type == 'yearly':
            transactions = transactions.filter(date__year=timezone.now().year)
        
        income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
        expenses = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
        
        p.drawString(100, 730, "Financial Summary:")
        p.drawString(120, 710, f"Income: ${income:.2f}")
        p.drawString(120, 690, f"Expenses: ${expenses:.2f}")
        p.drawString(120, 670, f"Savings: ${income - expenses:.2f}")
        
        # Add top expense categories
        p.drawString(100, 640, "Top Expense Categories:")
        categories = transactions.filter(type='expense').values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        
        y = 620
        for cat in categories:
            p.drawString(120, y, f"{cat['category']}: ${cat['total']:.2f} ({cat['count']} transactions)")
            y -= 20
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return Response(buffer, content_type='application/pdf')

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        message = request.data.get('message', '').lower()
        user = request.user
        
        try:
            # Get user's financial data
            transactions = Transaction.objects.filter(user=user)
            income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            expenses = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            savings = income - expenses
            
            # Get recent transactions
            recent_transactions = transactions.order_by('-date')[:3]
            
            # Get expense categories
            expense_categories = transactions.filter(type='expense').values('category').annotate(
                total=Sum('amount')
            ).order_by('-total')
            
            # Get savings goal if exists
            try:
                savings_goal = SavingsGoal.objects.get(user=user)
                savings_progress = (savings_goal.current_amount / savings_goal.target_amount) * 100
            except SavingsGoal.DoesNotExist:
                savings_goal = None
            
            # Process the message
            if any(greeting in message for greeting in ['hi', 'hello', 'hey']):
                response = "Hello! I'm your BudgetBuddy assistant. How can I help you today?"
            
            elif 'balance' in message or 'saving' in message:
                response = f"Your current financial summary:\n"
                response += f"- Income: ${income:.2f}\n"
                response += f"- Expenses: ${expenses:.2f}\n"
                response += f"- Savings: ${savings:.2f}\n"
                if savings_goal:
                    response += f"\nSavings Goal Progress: {savings_progress:.1f}% (${savings_goal.current_amount:.2f} of ${savings_goal.target_amount:.2f})"
            
            elif 'expense' in message or 'spend' in message:
                if 'category' in message or 'categories' in message:
                    response = "Your top expense categories:\n"
                    for cat in expense_categories[:3]:
                        response += f"- {cat['category'].title()}: ${cat['total']:.2f}\n"
                else:
                    response = f"Your total expenses are ${expenses:.2f}. "
                    if expense_categories:
                        top_cat = expense_categories[0]
                        response += f"Your highest spending is on {top_cat['category']} (${top_cat['total']:.2f})."
            
            elif 'recent' in message or 'last' in message or 'latest' in message:
                if recent_transactions:
                    response = "Your recent transactions:\n"
                    for t in recent_transactions:
                        response += f"- {t.date.strftime('%b %d')}: {t.description} (${t.amount:.2f}, {t.category})\n"
                else:
                    response = "You don't have any recent transactions."
            
            elif 'budget' in message:
                budgets = Budget.objects.filter(user=user)
                if budgets.exists():
                    response = "Your current budgets:\n"
                    for budget in budgets:
                        spent = transactions.filter(
                            type='expense',
                            category=budget.category,
                            date__month=timezone.now().month
                        ).aggregate(Sum('amount'))['amount__sum'] or 0
                        remaining = budget.limit - spent
                        response += f"- {budget.category.title()}: ${spent:.2f} of ${budget.limit:.2f} (${remaining:.2f} remaining)\n"
                else:
                    response = "You haven't set up any budgets yet. You can create budgets in the Overview section."
            
            elif 'help' in message:
                response = "I can help you with:\n"
                response += "- Your current balance and savings\n"
                response += "- Expense categories and spending patterns\n"
                response += "- Recent transactions\n"
                response += "- Budget progress\n"
                response += "Try asking questions like:\n"
                response += "'What's my current balance?'\n"
                response += "'Where am I spending the most?'\n"
                response += "'Show me my recent transactions'\n"
                response += "'How are my budgets doing?'"
            
            else:
                response = "I'm not sure I understand. Try asking about:\n"
                response += "- Your balance or savings\n"
                response += "- Your expenses or spending\n"
                response += "- Recent transactions\n"
                response += "- Budget progress\n"
                response += "Or type 'help' for more options."
                
            return Response({'response': response})
            
        except Exception as e:
            print(f"Chatbot error: {str(e)}")
            return Response({'response': "Sorry, I'm having trouble accessing your data right now. Please try again later."})

class UserRegistrationView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # If login fails (status code 401), customize the error message
        if response.status_code == 401:
            error_message = "Invalid username or password. Please try again."
            response.data = {'error': error_message}
            
        return response


class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            # Generate a reset token (you can use Django's built-in password reset tools)
            reset_token = "generate-a-unique-token-here"  # Replace with actual token generation logic
            reset_link = f"http://localhost:3000/reset-password/{reset_token}"

            # Send the reset link via email
            send_mail(
                'Password Reset Request',
                f'Click the link to reset your password: {reset_link}',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset link sent to your email'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)


class CommentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        comments = Comment.objects.filter(transaction__user=request.user)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)