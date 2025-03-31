from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Transaction(models.Model):
    TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    EXPENSE_CATEGORIES = [
        ('food', 'Food'),
        ('transportation', 'Transportation'),
        ('housing', 'Housing'),
        ('entertainment', 'Entertainment'),
        ('utilities', 'Utilities'),
        ('health', 'Health'),
        ('education', 'Education'),
        ('other', 'Other'),
    ]
    
    INCOME_CATEGORIES = [
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('investments', 'Investments'),
        ('gifts', 'Gifts'),
        ('other-income', 'Other Income'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=20)
    date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.type} - {self.amount} - {self.description[:20]}"
    
    def get_category_choices(self):
        return self.INCOME_CATEGORIES if self.type == 'income' else self.EXPENSE_CATEGORIES

class SavingsGoal(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.user.username}'s savings goal"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('warning', 'Warning'),
        ('info', 'Information'),
        ('reminder', 'Reminder'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

class Budget(models.Model):
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=20, choices=Transaction.EXPENSE_CATEGORIES)
    limit = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    
    def __str__(self):
        return f"{self.user.username}'s {self.period} {self.category} budget"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transaction = models.ForeignKey('Transaction', on_delete=models.CASCADE)
    text = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.transaction.description}"