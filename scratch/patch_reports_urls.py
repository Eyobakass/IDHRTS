import re

with open('idhrts_backend/reports/urls.py', 'r') as f:
    content = f.read()

imports_old = """from .views import SIGTASExportView, DashboardMetricsView"""
imports_new = """from .views import SIGTASExportView, DashboardMetricsView, FullDatabaseExportView"""
content = content.replace(imports_old, imports_new)

urls_old = """    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
]"""
urls_new = """    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('export/<str:table_name>/', FullDatabaseExportView.as_view(), name='full-db-export'),
]"""
content = content.replace(urls_old, urls_new)

with open('idhrts_backend/reports/urls.py', 'w') as f:
    f.write(content)
print("Patched reports/urls.py")
