from django.urls import path
from .views import (
    SIGTASExportView,
    LandlordTaxSummaryView, DashboardMetricsView, FullDatabaseExportView,
    WoredaMonthlyReportPDFView, SubCityRevenueReportPDFView, DisputeStatsReportPDFView
)

urlpatterns = [
    path('sigtas/', SIGTASExportView.as_view(), name='sigtas-export'),
    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('export/<str:table_name>/', FullDatabaseExportView.as_view(), name='full-db-export'),
    path('woreda-monthly-pdf/', WoredaMonthlyReportPDFView.as_view(), name='woreda-monthly-pdf'),
    path('subcity-revenue-pdf/', SubCityRevenueReportPDFView.as_view(), name='subcity-revenue-pdf'),
    path('dispute-stats-pdf/', DisputeStatsReportPDFView.as_view(), name='dispute-stats-pdf'),
    # GAP-12: Landlord personal tax summary (FR-REP-001)
    path('landlord-summary-pdf/', LandlordTaxSummaryView.as_view(), name='landlord-summary-pdf'),
]
