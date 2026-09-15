import re

with open('idhrts_backend/users/urls.py', 'r') as f:
    content = f.read()

imports_old = """    SessionListView,
    RevokeSessionView
)"""
imports_new = """    SessionListView,
    RevokeSessionView,
    SystemConfigView,
    AuditLogViewSet
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')"""
content = content.replace(imports_old, imports_new)

urls_old = """    path('sessions/<uuid:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
]"""
urls_new = """    path('sessions/<uuid:session_id>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),
    
    # FR-ADMIN-003 & 004
    path('system-config/', SystemConfigView.as_view(), name='system-config'),
] + router.urls"""
content = content.replace(urls_old, urls_new)

with open('idhrts_backend/users/urls.py', 'w') as f:
    f.write(content)
print("Patched users/urls.py for Admin views")
