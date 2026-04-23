from rest_framework import serializers
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary


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