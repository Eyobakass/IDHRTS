from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/auth/', include('users.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/tax/', include('tax.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/disputes/', include('disputes.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/woreda/', include('woreda.urls')),
    path('api/notifications/', include('notifications.urls')),
]
