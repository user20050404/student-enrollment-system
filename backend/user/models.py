from django.db import models
from django.contrib.auth.models import User
from datetime import date
import uuid

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('registrar', 'Registrar'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    
    # ADD THESE NEW FIELDS
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
    def save(self, *args, **kwargs):
        if self.birth_date:
            try:
                today = date.today()
                self.age = today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
            except Exception:
                self.age = None
        super().save(*args, **kwargs)