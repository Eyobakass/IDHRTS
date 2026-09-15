import re

with open('idhrts_backend/properties/views.py', 'r') as f:
    content = f.read()

imports_old = """from .models import Property
from .serializers import PropertySerializer"""
imports_new = """from .models import Property
from .serializers import PropertySerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters"""
content = content.replace(imports_old, imports_new)

viewset_old = """class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer"""
viewset_new = """class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'sub_city', 'woreda']
    search_fields = ['house_number', 'cadastral_upi', 'landlord__tin', 'landlord__full_name_en']"""
content = content.replace(viewset_old, viewset_new)

with open('idhrts_backend/properties/views.py', 'w') as f:
    f.write(content)
print("Patched PropertyViewSet for filtering and search")
