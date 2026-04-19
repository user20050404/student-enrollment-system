from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary, UserProfile


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    total_units = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
    
    def get_total_units(self, obj):
        return obj.get_total_units()


class SectionSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.subject_name')
    subject_code = serializers.ReadOnlyField(source='subject.subject_code')
    available_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = '__all__'
    
    def get_available_slots(self, obj):
        return obj.max_capacity - obj.current_count


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.last_name')
    student_number = serializers.ReadOnlyField(source='student.student_number')
    student_first_name = serializers.ReadOnlyField(source='student.first_name')
    section_code = serializers.ReadOnlyField(source='section.section_code')
    subject_code = serializers.ReadOnlyField(source='section.subject.subject_code')
    subject_name = serializers.ReadOnlyField(source='section.subject.subject_name')
    units = serializers.ReadOnlyField(source='section.subject.units')
    schedule = serializers.ReadOnlyField(source='section.schedule')
    room = serializers.ReadOnlyField(source='section.room')
    semester = serializers.ReadOnlyField(source='section.semester')
    school_year = serializers.ReadOnlyField(source='section.school_year')
    
    class Meta:
        model = Enrollment
        fields = '__all__'


class EnrollmentSummarySerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.last_name')
    student_number = serializers.ReadOnlyField(source='student.student_number')
    
    class Meta:
        model = EnrollmentSummary
        fields = '__all__'


# ========== AUTHENTICATION SERIALIZERS ==========

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'full_name', 'role', 'phone', 'address', 'birth_date', 'age']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default='student', required=False)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    
    def validate(self, data):
        # Check if passwords match
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        
        # Check password length
        if len(data.get('password', '')) < 6:
            raise serializers.ValidationError({"password": "Password must be at least 6 characters"})
        
        # Check if username exists
        if User.objects.filter(username=data.get('username')).exists():
            raise serializers.ValidationError({"username": "Username already exists"})
        
        # Check if email exists
        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({"email": "Email already exists"})
        
        return data
    
    def create(self, validated_data):
        # Remove confirm_password and other non-user fields
        validated_data.pop('confirm_password', None)
        role = validated_data.pop('role', 'student')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        birth_date = validated_data.pop('birth_date', None)
        
        # Create User
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create UserProfile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            address=address,
            birth_date=birth_date
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, data):
        if not data.get('username') or not data.get('password'):
            raise serializers.ValidationError("Username and password are required")
        
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid username or password")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        
        refresh = RefreshToken.for_user(user)
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(profile).data
        }