from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
import uuid


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'full_name', 'role', 'phone', 
                  'address', 'birth_date', 'age', 'profile_picture_url', 'email_verified']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class ActivateAccountSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    
    def validate_token(self, value):
        try:
            profile = UserProfile.objects.get(email_verification_token=value)
            if profile.email_verified:
                raise serializers.ValidationError("Account already activated")
            return value
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Invalid activation token")
    
    def activate(self):
        profile = UserProfile.objects.get(email_verification_token=self.validated_data['token'])
        profile.email_verified = True
        profile.is_active = True
        profile.user.is_active = True
        profile.user.save()
        profile.save()
        return profile.user


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        profile_picture = validated_data.pop('profile_picture', None)
        
        # Create user (active immediately)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )
        
        # Create profile (already verified)
        profile = UserProfile.objects.create(
            user=user,
            profile_picture=profile_picture,
            email_verification_token=uuid.uuid4(),
            email_verified=True,
            is_active=True
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if not data.get('username') or not data.get('password'):
            raise serializers.ValidationError("Username and password are required")
        
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid username or password")
        
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled")
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if created:
            profile.email_verified = True
            profile.is_active = True
            profile.save()
        
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(profile).data
        }