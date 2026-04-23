from django.urls import path
from .views import (
    SubjectListCreateView,
    SubjectRetrieveUpdateDestroyView,
    StudentListCreateView,
    StudentRetrieveUpdateDestroyView,
    StudentEnrollmentsView,
    StudentSummaryView,
    StudentTotalUnitsView,
    StudentEnrolledSubjectsView,
    SectionListCreateView,
    SectionRetrieveUpdateDestroyView,
    SectionEnrollmentsView,
    EnrollmentListCreateView,
    EnrollmentRetrieveUpdateDestroyView,
    EnrollmentSummaryListCreateView,
    EnrollmentSummaryRetrieveUpdateDestroyView,
)

urlpatterns = [
    # SUBJECTS
    path('subjects/', SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:pk>/', SubjectRetrieveUpdateDestroyView.as_view(), name='subject-detail'),
    
    # STUDENTS
    path('students/', StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', StudentRetrieveUpdateDestroyView.as_view(), name='student-detail'),
    path('students/<int:pk>/enrollments/', StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('students/<int:pk>/summary/', StudentSummaryView.as_view(), name='student-summary'),
    path('students/<int:pk>/total-units/', StudentTotalUnitsView.as_view(), name='student-total-units'),
    path('students/<int:pk>/enrolled-subjects/', StudentEnrolledSubjectsView.as_view(), name='student-enrolled-subjects'),
    
    # SECTIONS
    path('sections/', SectionListCreateView.as_view(), name='section-list-create'),
    path('sections/<int:pk>/', SectionRetrieveUpdateDestroyView.as_view(), name='section-detail'),
    path('sections/<int:pk>/enrollments/', SectionEnrollmentsView.as_view(), name='section-enrollments'),
    
    # ENROLLMENTS
    path('enrollments/', EnrollmentListCreateView.as_view(), name='enrollment-list-create'),
    path('enrollments/<int:pk>/', EnrollmentRetrieveUpdateDestroyView.as_view(), name='enrollment-detail'),
    
    # ENROLLMENT SUMMARIES
    path('summaries/', EnrollmentSummaryListCreateView.as_view(), name='summary-list-create'),
    path('summaries/<int:pk>/', EnrollmentSummaryRetrieveUpdateDestroyView.as_view(), name='summary-detail'),
]