from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContractViewSet, PublicContractView

router = DefaultRouter()
router.register(r'public', PublicContractView, basename='public-contract')
router.register(r'', ContractViewSet, basename='contract')

urlpatterns = [
    path('', include(router.urls)),
]
