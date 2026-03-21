from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary
from .serializers import (
    SubjectSerializer, StudentSerializer, SectionSerializer,
    EnrollmentSerializer, EnrollmentSummarySerializer
)

class SubjectViewSet(viewsets.ModelViewSet):
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

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        student = self.get_object()
        enrollments = student.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        student = self.get_object()
        summaries = student.summaries.all()
        serializer = EnrollmentSummarySerializer(summaries, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def total_units(self, request, pk=None):
        student = self.get_object()
        semester = request.query_params.get('semester', None)
        school_year = request.query_params.get('school_year', None)
        total_units = student.get_total_units(semester, school_year)
        return Response({'total_units': total_units})
    
    @action(detail=True, methods=['get'])
    def enrolled_subjects(self, request, pk=None):
        student = self.get_object()
        enrollments = student.enrollments.filter(status='enrolled')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

class SectionViewSet(viewsets.ModelViewSet):
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
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        section = self.get_object()
        enrollments = section.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

class EnrollmentViewSet(viewsets.ModelViewSet):
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

class EnrollmentSummaryViewSet(viewsets.ModelViewSet):
    queryset = EnrollmentSummary.objects.all()
    serializer_class = EnrollmentSummarySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset