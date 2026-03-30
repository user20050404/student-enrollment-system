from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary
from .serializers import (
    SubjectSerializer, StudentSerializer, SectionSerializer,
    EnrollmentSerializer, EnrollmentSummarySerializer
)

# Subject Views
class SubjectListCreateView(ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class SubjectRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
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

# Student Views
class StudentListCreateView(ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class StudentRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class StudentEnrollmentsView(APIView):
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            enrollments = student.enrollments.all()
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

class StudentSummaryView(APIView):
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            summaries = student.summaries.all()
            serializer = EnrollmentSummarySerializer(summaries, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

class StudentTotalUnitsView(APIView):
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
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            enrollments = student.enrollments.filter(status='enrolled')
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

# Section Views
class SectionListCreateView(ListCreateAPIView):
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
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class SectionEnrollmentsView(APIView):
    def get(self, request, pk):
        try:
            section = Section.objects.get(pk=pk)
            enrollments = section.enrollments.all()
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data)
        except Section.DoesNotExist:
            return Response({'error': 'Section not found'}, status=status.HTTP_404_NOT_FOUND)

# Enrollment Views
class EnrollmentListCreateView(ListCreateAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                self.perform_create(serializer)
                
                # Update enrollment summary
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
                
                # Update summary
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

# Enrollment Summary Views
class EnrollmentSummaryListCreateView(ListCreateAPIView):
    queryset = EnrollmentSummary.objects.all()
    serializer_class = EnrollmentSummarySerializer

class EnrollmentSummaryRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = EnrollmentSummary.objects.all()
    serializer_class = EnrollmentSummarySerializer