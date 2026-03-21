from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Sum

class Subject(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    subject_code = models.CharField(max_length=20, unique=True)
    subject_name = models.CharField(max_length=200)
    units = models.IntegerField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    offered_on = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.subject_code} - {self.subject_name}"

class Student(models.Model):
    YEAR_LEVEL_CHOICES = [
        ('1', '1st Year'),
        ('2', '2nd Year'),
        ('3', '3rd Year'),
        ('4', '4th Year'),
    ]
    
    PROGRAM_CHOICES = [
        ('BSIT', 'BS Information Technology'),
        ('BSCS', 'BS Computer Science'),
        ('BSIS', 'BS Information Systems'),
    ]
    
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('not_enrolled', 'Not Enrolled'),
        ('graduated', 'Graduated'),
        ('dropped', 'Dropped'),
    ]
    
    student_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    year_level = models.CharField(max_length=2, choices=YEAR_LEVEL_CHOICES)
    program = models.CharField(max_length=10, choices=PROGRAM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_enrolled')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student_number} - {self.last_name}, {self.first_name}"
    
    def get_total_units(self, semester=None, school_year=None):
        """Calculate total enrolled units"""
        enrollments = self.enrollments.filter(status='enrolled')
        if semester:
            enrollments = enrollments.filter(section__semester=semester)
        if school_year:
            enrollments = enrollments.filter(section__school_year=school_year)
        
        total = enrollments.aggregate(total_units=Sum('section__subject__units'))['total_units'] or 0
        return total
    
    def get_enrolled_subjects(self):
        """Get list of enrolled subjects"""
        return self.enrollments.filter(status='enrolled').select_related('section__subject')

class Section(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]
    
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sections')
    section_code = models.CharField(max_length=50)
    max_capacity = models.IntegerField()
    current_count = models.IntegerField(default=0)
    schedule = models.CharField(max_length=200)
    room = models.CharField(max_length=50)
    semester = models.CharField(max_length=20)
    school_year = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    class Meta:
        unique_together = ['subject', 'section_code']
    
    def clean(self):
        if self.current_count > self.max_capacity:
            raise ValidationError("Current count cannot exceed max capacity")
    
    def save(self, *args, **kwargs):
        if self.current_count >= self.max_capacity:
            self.status = 'closed'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.subject.subject_code} - {self.section_code}"
    
    @property
    def available_slots(self):
        return self.max_capacity - self.current_count

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('dropped', 'Dropped'),
        ('completed', 'Completed'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    
    class Meta:
        unique_together = ['student', 'section']  # Prevent duplicate enrollment in same section
    
    def clean(self):
        # Check if section is full
        if self.section.current_count >= self.section.max_capacity:
            raise ValidationError("Section is already full")
        
        # Check if student is already enrolled in the same subject (different section)
        # This prevents enrolling in multiple sections of the same subject
        existing_enrollment = Enrollment.objects.filter(
            student=self.student,
            section__subject=self.section.subject,
            status='enrolled'
        ).exclude(id=self.id)
        
        if existing_enrollment.exists():
            raise ValidationError(
                f"Student is already enrolled in {self.section.subject.subject_name}. "
                f"Cannot enroll in multiple sections of the same subject."
            )
    
    def save(self, *args, **kwargs):
        if not self.pk:  # New enrollment
            if self.section.current_count >= self.section.max_capacity:
                raise ValidationError("Cannot enroll: Section is full")
            self.section.current_count += 1
            self.section.save()
        super().save(*args, **kwargs)
        
        # Update student status if not already enrolled
        if self.student.status != 'enrolled':
            self.student.status = 'enrolled'
            self.student.save()
    
    def delete(self, *args, **kwargs):
        self.section.current_count -= 1
        self.section.save()
        super().delete(*args, **kwargs)
        
        # Update student status if no enrollments left
        if self.student.enrollments.filter(status='enrolled').count() == 0:
            self.student.status = 'not_enrolled'
            self.student.save()
    
    def __str__(self):
        return f"{self.student.student_number} - {self.section.section_code}"

class EnrollmentSummary(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='summaries')
    semester = models.CharField(max_length=20)
    school_year = models.CharField(max_length=20)
    total_enrolled_units = models.IntegerField(default=0)
    total_sections = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'semester', 'school_year']
    
    def update_summary(self):
        enrollments = self.student.enrollments.filter(
            status='enrolled',
            section__semester=self.semester,
            section__school_year=self.school_year
        )
        self.total_sections = enrollments.count()
        self.total_enrolled_units = sum(e.section.subject.units for e in enrollments)
        self.save()
    
    def __str__(self):
        return f"{self.student.student_number} - {self.semester} {self.school_year}"