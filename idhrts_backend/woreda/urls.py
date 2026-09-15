from django.urls import path
from .views import WoredaDashboardStatsView, SummonsPDFView, RegistrationNoticePDFView, WalkInPropertyRegistrationView, WalkInDisputeFilingView

urlpatterns = [
    path('stats/', WoredaDashboardStatsView.as_view(), name='woreda-stats'),
    path('disputes/<uuid:pk>/summons/', SummonsPDFView.as_view(), name='woreda-summons-pdf'),
    path('contracts/<uuid:pk>/certificate/', RegistrationNoticePDFView.as_view(), name='woreda-contract-cert'),
    path('walk-in/property/', WalkInPropertyRegistrationView.as_view(), name='walkin-property'),
    path('walk-in/dispute/', WalkInDisputeFilingView.as_view(), name='walkin-dispute'),
]

