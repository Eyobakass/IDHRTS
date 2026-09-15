from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxPaymentViewSet, ChapaWebhookView, ReconcilePRNView

router = DefaultRouter()
router.register(r'webhook', ChapaWebhookView, basename='chapa-webhook')
router.register(r'', TaxPaymentViewSet, basename='payment')

urlpatterns = [
    path('reconcile-prn/', ReconcilePRNView.as_view(), name='reconcile-prn'),
    path('', include(router.urls)),
]
