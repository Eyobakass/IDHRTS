import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from payments.models import TaxPayment

class SIGTASExportView(APIView):
    def get(self, request):
        if request.user.role != 'TAX_OFFICER':
            return HttpResponse('Unauthorized', status=403)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sigtas_schedule_b.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['TIN', 'Taxpayer Name', 'Property ID', 'Fiscal Year', 'Gross Rent ETB', 
                         'Deduction ETB', 'Taxable Income ETB', 'Tax Due ETB', 'Amount Paid ETB', 
                         'Payment Date', 'Payment Method', 'Payment Reference', 'Assessment Period'])
                         
        payments = TaxPayment.objects.filter(
            status='CONFIRMED', 
            landlord__sub_city=request.user.sub_city
        )
        
        for p in payments:
            a = p.assessment
            writer.writerow([
                p.landlord.tin, p.landlord.full_name_en, str(a.property.id), a.fiscal_year,
                a.gross_annual_rent_etb, a.deduction_etb, a.taxable_income_etb, a.tax_due_etb,
                p.amount_etb, p.confirmed_at.date() if p.confirmed_at else '', p.payment_method, 
                p.chapa_tx_ref or p.prn_code, 'ANNUAL'
            ])

        return response


from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from properties.models import Property
        from contracts.models import RentalContract
        from disputes.models import Dispute
        from tax.models import TaxAssessment
        from django.core.cache import cache

        # Determine cache key based on user role and woreda (in case filtering is added later)
        # Currently, it returns global stats, but caching is set up securely.
        cache_key = f"dashboard_metrics_{request.user.role}_{request.user.woreda if request.user.woreda else 'global'}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        # Core Counts
        total_properties = Property.objects.count()
        active_properties = Property.objects.filter(status='ACTIVE').count()
        
        total_contracts = RentalContract.objects.count()
        registered_contracts = RentalContract.objects.filter(status='REGISTERED').count()
        
        total_disputes = Dispute.objects.count()
        open_disputes = Dispute.objects.exclude(status='CLOSED').count()

        # Financials (Tax)
        total_tax_due = TaxAssessment.objects.aggregate(total=Sum('tax_due_etb'))['total'] or 0
        total_tax_paid = TaxAssessment.objects.filter(status='PAID').aggregate(total=Sum('tax_due_etb'))['total'] or 0

        # Monthly Trends (Last 6 Months of Contracts)
        six_months_ago = timezone.now() - timedelta(days=180)
        recent_contracts = RentalContract.objects.filter(created_at__gte=six_months_ago)
        
        # Simple Python-side aggregation for SQLite/Postgres cross-compatibility
        # Format: { "YYYY-MM": count }
        trend_dict = {}
        for c in recent_contracts:
            month_key = c.created_at.strftime('%Y-%m')
            trend_dict[month_key] = trend_dict.get(month_key, 0) + 1
            
        trend_data = [{"month": k, "contracts": v} for k, v in sorted(trend_dict.items())]

        response_data = {
            # Flat top-level keys for direct frontend access
            "total_properties": total_properties,
            "active_properties": active_properties,
            "total_contracts": total_contracts,
            "registered_contracts": registered_contracts,
            "total_disputes": total_disputes,
            "open_disputes": open_disputes,
            "total_tax_due_etb": float(total_tax_due),
            "total_tax_paid_etb": float(total_tax_paid),
            # Nested structure for charts
            "metrics": {
                "properties": {"total": total_properties, "active": active_properties},
                "contracts": {"total": total_contracts, "registered": registered_contracts},
                "disputes": {"total": total_disputes, "open": open_disputes},
                "financials": {"total_tax_due_etb": float(total_tax_due), "total_tax_paid_etb": float(total_tax_paid)}
            },
            "trends": trend_data
        }
        
        cache.set(cache_key, response_data, 60 * 5) # Cache for 5 minutes
        return Response(response_data)

class FullDatabaseExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, table_name):
        if request.user.role != 'ADMIN':
            return HttpResponse('Unauthorized', status=403)
            
        import csv
        from django.http import HttpResponse
        from django.apps import apps
        
        # Map URL table name to actual Model
        table_mapping = {
            'users': ('users', 'User'),
            'properties': ('properties', 'Property'),
            'contracts': ('contracts', 'RentalContract'),
            'tax_assessments': ('tax', 'TaxAssessment'),
            'tax_payments': ('payments', 'TaxPayment'),
            'disputes': ('disputes', 'Dispute'),
            'audit_logs': ('users', 'AuditLog'),
            'notifications': ('notifications', 'Notification'),
        }
        
        if table_name not in table_mapping:
            return HttpResponse('Invalid table name', status=400)
            
        app_label, model_name = table_mapping[table_name]
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            return HttpResponse('Model not found', status=404)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{table_name}_export.csv"'
        writer = csv.writer(response)
        
        # Get all field names
        fields = [f.name for f in model._meta.fields]
        writer.writerow(fields)
        
        # Stream data to CSV
        for obj in model.objects.all().iterator():
            row = []
            for field in fields:
                val = getattr(obj, field)
                if val is None:
                    row.append('')
                else:
                    row.append(str(val))
            writer.writerow(row)
            
        # Log the export action
        from users.models import AuditLog
        AuditLog.objects.create(
            actor=request.user,
            action='FULL_DB_EXPORT',
            target_type=model_name,
            ip_address=request.META.get('REMOTE_ADDR')
        )
            
        return response


class WoredaMonthlyReportPDFView(APIView):
    """GAP-13 (FR-REP-002): Woreda monthly report. Supports custom date range and ?format=csv."""
    def get(self, request):
        if request.user.role not in ['WOREDA_OFFICER', 'ADMIN']:
            return Response({'error': 'Unauthorized'}, status=403)
        from django.utils import timezone
        from datetime import timedelta
        from contracts.models import RentalContract
        import csv

        end_date_str = request.query_params.get('end_date')
        start_date_str = request.query_params.get('start_date')
        export_format = request.query_params.get('format', 'pdf')

        end_date = timezone.now()
        if end_date_str:
            from django.utils.dateparse import parse_datetime
            end_date = parse_datetime(end_date_str) or end_date
        start_date = end_date - timedelta(days=30)
        if start_date_str:
            from django.utils.dateparse import parse_datetime
            start_date = parse_datetime(start_date_str) or start_date

        contracts = RentalContract.objects.filter(
            property__woreda=request.user.woreda,
            created_at__gte=start_date,
            created_at__lte=end_date,
        ).select_related('landlord', 'tenant', 'property')

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="woreda_monthly_report.csv"'
            writer = csv.writer(response)
            writer.writerow(['Contract #', 'Landlord', 'Tenant', 'Property', 'Monthly Rent ETB', 'Status', 'Start Date'])
            for c in contracts:
                writer.writerow([
                    c.contract_reg_number, c.landlord.full_name_en, c.tenant.full_name_en if c.tenant else '',
                    c.property.house_number, c.monthly_rent_etb, c.status,
                    c.lease_start_date.strftime('%Y-%m-%d') if c.lease_start_date else '',
                ])
            return response

        # PDF path (existing)
        from core.pdf_utils import generate_woreda_monthly_report_pdf
        buffer = generate_woreda_monthly_report_pdf(contracts, start_date, end_date, request.user.woreda)
        return FileResponse(buffer, as_attachment=True, filename="woreda_monthly_report.pdf")

class SubCityRevenueReportPDFView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['TAX_OFFICER', 'ADMIN']:
            return HttpResponse('Unauthorized', status=403)
        
        import io
        from django.http import FileResponse
        from reportlab.pdfgen import canvas
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 800, 'Sub-City Tax Revenue Report')
        p.drawString(100, 780, f'Requested by: {request.user.full_name_en}')
        
        from payments.models import TaxPayment
        from django.db.models import Sum
        qs = TaxPayment.objects.filter(status='CONFIRMED')
        if request.user.role == 'TAX_OFFICER':
            qs = qs.filter(landlord__sub_city=request.user.sub_city)
            
        total = qs.aggregate(Sum('amount_etb'))['amount_etb__sum'] or 0
        p.drawString(100, 740, f'Total Revenue Collected: ETB {total:,.2f}')
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='SubCity_Revenue_Report.pdf')

class DisputeStatsReportPDFView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['WOREDA_OFFICER', 'ADMIN']:
            return HttpResponse('Unauthorized', status=403)
            
        import io
        from django.http import FileResponse
        from reportlab.pdfgen import canvas
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 800, 'Dispute Resolution Statistics Report')
        p.drawString(100, 780, f'Requested by: {request.user.full_name_en}')
        
        from disputes.models import Dispute
        qs = Dispute.objects.all()
        if request.user.role == 'WOREDA_OFFICER':
            qs = qs.filter(woreda=request.user.woreda)
            
        p.drawString(100, 740, f'Total Disputes: {qs.count()}')
        p.drawString(100, 720, f'Closed Disputes: {qs.filter(status="CLOSED").count()}')
        p.drawString(100, 700, f'Appealed Disputes: {qs.filter(status="APPEALED").count()}')
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='Dispute_Stats_Report.pdf')


class LandlordTaxSummaryView(APIView):
    """GAP-12 (FR-REP-001): Generates a personal annual tax summary PDF for the landlord."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'LANDLORD':
            return Response({'error': 'Only landlords can access their tax summary.'}, status=403)

        from tax.models import TaxAssessment
        from payments.models import TaxPayment
        import io
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors

        assessments = TaxAssessment.objects.filter(landlord=request.user).select_related('property').order_by('-created_at')
        payments = TaxPayment.objects.filter(landlord=request.user, status='CONFIRMED')

        width, height = A4
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)

        # Header
        c.setFillColor(colors.HexColor('#1E3A5F'))
        c.rect(0, height - 90, width, 90, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(40, height - 38, "Personal Tax Summary Report")
        c.setFont("Helvetica", 10)
        c.drawString(40, height - 58, f"Landlord: {request.user.full_name_en} | TIN: {request.user.tin or 'N/A'}")
        c.drawString(40, height - 72, f"Generated: {__import__('datetime').datetime.now().strftime('%d %B %Y')}")

        c.setFillColor(colors.black)
        y = height - 120

        # Assessments table
        c.setFont("Helvetica-Bold", 11)
        c.drawString(40, y, "Tax Assessments")
        y -= 20
        headers = ["Property", "Fiscal Year", "Tax Due (ETB)", "Status", "PRN"]
        col_x = [40, 140, 270, 380, 460]
        c.setFont("Helvetica-Bold", 9)
        for i, h in enumerate(headers):
            c.drawString(col_x[i], y, h)
        y -= 5
        c.line(40, y, width - 40, y); y -= 15
        c.setFont("Helvetica", 9)
        for a in assessments[:30]:
            if y < 80:
                c.showPage(); y = height - 60
            vals = [
                a.property.house_number if a.property else "—",
                a.fiscal_year if hasattr(a, 'fiscal_year') else "—",
                f"{a.tax_due_etb:,.2f}",
                a.status,
                (a.prn_code or "—")[:12],
            ]
            for i, v in enumerate(vals):
                c.drawString(col_x[i], y, str(v))
            y -= 16

        y -= 20
        total_paid = sum(p.amount_etb for p in payments)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(40, y, f"Total Tax Paid (Confirmed): {total_paid:,.2f} ETB")

        c.showPage(); c.save(); buf.seek(0)
        return HttpResponse(buf.read(), content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="landlord_tax_summary.pdf"'})
