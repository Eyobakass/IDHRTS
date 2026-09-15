from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView
from .views import (
    LoginView,
    FaydaMockLoginView,
    RegisterView,
    RegisterVerifyView,
    OfficersListView,
    DeactivateOfficerView,
    GenerateIncidentReportView,
    UnlockAccountView,
    CreateOfficerView,
    RequestPinResetView,
    ConfirmPinResetView,
    ChangePinView,
    SessionListView,
    RevokeSessionView,
    SystemConfigView,
    AuditLogViewSet,
    UpdatePreferencesView,
    LandlordPortfolioView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('preferences/', UpdatePreferencesView.as_view(), name='preferences'),
    path('landlords/portfolio/', LandlordPortfolioView.as_view(), name='landlord-portfolio'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('register/verify/', RegisterVerifyView.as_view(), name='register-verify'),
    # FR-AUTH-005: logout blacklists the refresh token so it cannot be redeemed.
    path('logout/', TokenBlacklistView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('officers/', OfficersListView.as_view(), name='officers-list'),
    path('<uuid:id>/deactivate/', DeactivateOfficerView.as_view(), name='deactivate-officer'),
    path('<uuid:id>/unlock/', UnlockAccountView.as_view(), name='unlock-account'),
    path('<uuid:officer_id>/incident-report/', GenerateIncidentReportView.as_view(), name='incident-report'),
    
    # FR-AUTH-002: Create Officer
    path('officers/create/', CreateOfficerView.as_view(), name='create-officer'),
    
    # FR-AUTH-007: PIN Reset
    path('pin/request-reset/', RequestPinResetView.as_view(), name='request-pin-reset'),
    path('pin/confirm-reset/', ConfirmPinResetView.as_view(), name='confirm-pin-reset'),
    path('pin/change/', ChangePinView.as_view(), name='change-pin'),
    # FR-AUTH-004: Fayda mock login
    path('fayda/login/', FaydaMockLoginView.as_view(), name='fayda-mock-login'),
    
    # FR-AUTH-009: Session Management
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/<uuid:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
    
    # FR-ADMIN-003 & 004
    path('system-config/', SystemConfigView.as_view(), name='system-config'),
] + router.urls
