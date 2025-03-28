from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Transaction, Comment, SavingsGoal, Notification
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Budget

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False},
            'username': {'read_only': True}
        }

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'type', 'amount', 'description', 'category', 'date', 'user']
        extra_kwargs = {
            'user': {'read_only': True}
        }

class SavingsGoalSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = SavingsGoal
        fields = ['id', 'target_amount', 'current_amount', 'progress']
    
    def get_progress(self, obj):
        if obj.target_amount == 0:
            return 0
        return (obj.current_amount / obj.target_amount) * 100

class NotificationSerializer(serializers.ModelSerializer):
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at', 'formatted_date']
    
    def get_formatted_date(self, obj):
        return obj.created_at.strftime("%b %d, %Y %I:%M %p")

class BudgetSerializer(serializers.ModelSerializer):
    spent = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = ['id', 'category', 'limit', 'period', 'spent', 'progress']
        extra_kwargs = {
            'user': {'read_only': True}
        }
    
    def get_spent(self, obj):
        # Calculate how much has been spent in this budget category
        expenses = Transaction.objects.filter(
            user=obj.user,
            type='expense',
            category=obj.category
        )
        if obj.period == 'weekly':
            expenses = expenses.filter(date__week=timezone.now().isocalendar()[1])
        elif obj.period == 'monthly':
            expenses = expenses.filter(date__month=timezone.now().month)
        elif obj.period == 'yearly':
            expenses = expenses.filter(date__year=timezone.now().year)
        
        return expenses.aggregate(Sum('amount'))['amount__sum'] or 0
    
    def get_progress(self, obj):
        spent = self.get_spent(obj)
        if obj.limit == 0:
            return 0
        return (spent / obj.limit) * 100

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles user registration with password validation
    Includes additional security checks and email validation
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters"
    )
    email = serializers.EmailField(
        required=True,
        help_text="A valid email address is required"
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'username': {
                'min_length': 4,
                'help_text': "Username must be at least 4 characters"
            }
        }

    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Ensure username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        """Create user with hashed password and default profile"""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes additional user data in the token
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        """Add additional response data"""
        data = super().validate(attrs)
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email
            }
        })
        return data

class CommentSerializer(serializers.ModelSerializer):
    """
    Comment serializer with user details and validation
    Includes anti-spam measures for rapid commenting
    """
    user = UserSerializer(read_only=True)
    transaction = serializers.PrimaryKeyRelatedField(
        queryset=Transaction.objects.all(),
        required=True
    )

    class Meta:
        model = Comment
        fields = ['id', 'user', 'transaction', 'text', 'date']
        read_only_fields = ['id', 'user', 'date']

    def validate(self, data):
        """Prevent rapid commenting from the same user"""
        user = self.context['request'].user
        last_comment = Comment.objects.filter(user=user).order_by('-date').first()
        
        if last_comment and (timezone.now() - last_comment.date) < timedelta(seconds=30):
            raise serializers.ValidationError(
                "Please wait 30 seconds before posting another comment"
            )
        
        return data

    def create(self, validated_data):
        """Auto-set the user and date when creating a comment"""
        validated_data['user'] = self.context['request'].user
        validated_data['date'] = timezone.now()
        return super().create(validated_data)