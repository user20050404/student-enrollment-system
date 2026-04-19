from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary, UserProfile
from .serializers import (
    SubjectSerializer, StudentSerializer, SectionSerializer,
    EnrollmentSerializer, EnrollmentSummarySerializer,
    RegisterSerializer, LoginSerializer, UserProfileSerializer
)


# ========== AUTHENTICATION VIEWS ==========

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                
                # Get or create profile
                profile, created = UserProfile.objects.get_or_create(user=user)
                
                return Response({
                    'message': 'Registration successful',
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    },
                    'profile': {
                        'role': profile.role,
                        'phone': profile.phone or '',
                        'address': profile.address or '',
                        'birth_date': profile.birth_date if profile.birth_date else None,
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Return detailed field errors
            error_details = {}
            for field, errors in serializer.errors.items():
                error_details[field] = errors[0] if errors else 'This field is invalid'
            
            return Response({
                'error': 'Please check the following fields:',
                'field_errors': error_details,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            user = request.user
            
            # Update user info
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.email = request.data.get('email', user.email)
            user.save()
            
            # Update profile info
            profile.phone = request.data.get('phone', profile.phone)
            profile.address = request.data.get('address', profile.address)
            profile.birth_date = request.data.get('birth_date', profile.birth_date)
            profile.save()
            
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)


# ========== SUBJECT VIEWS ==========

class SubjectListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class SubjectRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    
    def destroy(self, request, *args, **kwargs):
        subject = self.get_object()
        if subject.sections.exists():
            return Response(
                {'error': 'Cannot delete subject with existing sections'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


# ========== STUDENT VIEWS ==========

class StudentListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class StudentRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class StudentEnrollmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            enrollments = student.enrollments.all()
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            summaries = student.summaries.all()
            serializer = EnrollmentSummarySerializer(summaries, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentTotalUnitsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            semester = request.query_params.get('semester', None)
            school_year = request.query_params.get('school_year', None)
            total_units = student.get_total_units(semester, school_year)
            return Response({'total_units': total_units})
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentEnrolledSubjectsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            enrollments = student.enrollments.filter(status='enrolled')
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


# ========== SECTION VIEWS ==========

class SectionListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SectionRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Section.objects.all()
    serializer_class = SectionSerializer


class SectionEnrollmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            section = Section.objects.get(pk=pk)
            enrollments = section.enrollments.all()
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found'}, status=status.HTTP_404_NOT_FOUND)


# ========== ENROLLMENT VIEWS ==========

class EnrollmentListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                self.perform_create(serializer)
                
                student = serializer.instance.student
                semester = serializer.instance.section.semester
                school_year = serializer.instance.section.school_year
                
                summary, created = EnrollmentSummary.objects.get_or_create(
                    student=student,
                    semester=semester,
                    school_year=school_year
                )
                summary.update_summary()
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                enrollment = self.get_object()
                student = enrollment.student
                semester = enrollment.section.semester
                school_year = enrollment.section.school_year
                
                self.perform_destroy(enrollment)
                
                summary = EnrollmentSummary.objects.filter(
                    student=student,
                    semester=semester,
                    school_year=school_year
                ).first()
                if summary:
                    summary.update_summary()
                
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ========== ENROLLMENT SUMMARY VIEWS ==========

class EnrollmentSummaryListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = EnrollmentSummary.objects.all()
    serializer_class = EnrollmentSummarySerializer


class EnrollmentSummaryRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = EnrollmentSummary.objects.all()
    serializer_class = EnrollmentSummarySerializer