import re

with open('idhrts_backend/users/urls.py', 'r') as f:
    content = f.read()

# Add imports
imports_old = """    UnlockAccountView
)"""
imports_new = """    UnlockAccountView,
    CreateOfficerView,
    RequestPinResetView,
    ConfirmPinResetView,
    ChangePinView,
    SessionListView,
    RevokeSessionView
)"""
content = content.replace(imports_old, imports_new)

# Add URL patterns
urls_old = """    path('<uuid:officer_id>/incident-report/', GenerateIncidentReportView.as_view(), name='incident-report'),
]"""
urls_new = """    path('<uuid:officer_id>/incident-report/', GenerateIncidentReportView.as_view(), name='incident-report'),
    
    # FR-AUTH-002: Create Officer
    path('officers/create/', CreateOfficerView.as_view(), name='create-officer'),
    
    # FR-AUTH-007: PIN Reset
    path('pin/request-reset/', RequestPinResetView.as_view(), name='request-pin-reset'),
    path('pin/confirm-reset/', ConfirmPinResetView.as_view(), name='confirm-pin-reset'),
    path('pin/change/', ChangePinView.as_view(), name='change-pin'),
    
    # FR-AUTH-009: Session Management
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/<uuid:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
]"""
content = content.replace(urls_old, urls_new)

with open('idhrts_backend/users/urls.py', 'w') as f:
    f.write(content)
print("Patched users/urls.py")
