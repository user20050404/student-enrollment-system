from django.contrib import admin
from .models import Subject, Student, Section, Enrollment, EnrollmentSummary

# Register your models here.
admin.site.register(Subject)
admin.site.register(Student)
admin.site.register(Section)
admin.site.register(Enrollment)
admin.site.register(EnrollmentSummary)