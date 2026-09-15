from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxAssessmentViewSet

router = DefaultRouter()
router.register(r'', TaxAssessmentViewSet, basename='tax')

urlpatterns = [
    path('', include(router.urls)),
]
