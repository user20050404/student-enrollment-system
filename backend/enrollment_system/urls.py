from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'sections', views.SectionViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'summaries', views.EnrollmentSummaryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]