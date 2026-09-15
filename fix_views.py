import codecs
content = """import hmac
import hashlib
import logging
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from .models import TaxPayment
from tax.models import TaxAssessment
from .serializers import TaxPaymentSerializer

logger = logging.getLogger(__name__)


def chapa_redirect_urls():
    urls = {}
    if settings.PUBLIC_BASE_URL:
        urls['callback_url'] = f"{settings.PUBLIC_BASE_URL}{settings.CHAPA_CALLBACK_PATH}"
    if settings.FRONTEND_BASE_URL:
        urls['return_url'] = f"{settings.FRONTEND_BASE_URL}{settings.CHAPA_RETURN_PATH}"
    if not urls:
        logger.warning(
            "PUBLIC_BASE_URL/FRONTEND_BASE_URL are unset; Chapa cannot call back into this deployment"
        )
    return urls

class TaxPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = TaxPaymentSerializer

    def get_queryset(self):
        return TaxPayment.objects.filter(landlord=self.request.user)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        payment = self.get_object()
        if payment.status != 'CONFIRMED':
            return Response({'error': 'Receipt is only available for CONFIRMED payments.'}, status=400)
            
        from .utils import generate_payment_receipt_pdf
        from django.http import HttpResponse
        
        pdf_bytes = generate_payment_receipt_pdf(payment)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="payment_receipt_{payment.id}.pdf"'
        return response

    @action(detail=False, methods=['post'])
    def initialize_chapa(self, request):
        import requests
        assessment_id = request.data.get('assessment_id')
        try:
            assessment = TaxAssessment.objects.get(id=assessment_id, landlord=request.user)
            tx_ref = f"TX-{assessment.id.hex[:8]}"
            payment, created = TaxPayment.objects.get_or_create(
                assessment=assessment,
                landlord=request.user,
                chapa_tx_ref=tx_ref,
                defaults={
                    'amount_etb': assessment.tax_due_etb,
                    'payment_method': 'CHAPA_TELEBIRR',
                    'status': 'PROCESSING',
                }
            )
            
            headers = {
                "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "amount": str(payment.amount_etb),
                "currency": "ETB",
                "email": request.user.email if getattr(request.user, 'email', None) else "default@example.com",
                "first_name": request.user.first_name if getattr(request.user, 'first_name', None) else "Landlord",
                "last_name": request.user.last_name if getattr(request.user, 'last_name', None) else "User",
                "tx_ref": payment.chapa_tx_ref,
                "customization[title]": "Tax Payment",
                "customization[description]": "IDHRTS Tax Payment"
            }
            payload.update(chapa_redirect_urls())
            response = requests.post("https://api.chapa.co/v1/transaction/initialize", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                checkout_url = data.get("data", {}).get("checkout_url")
                return Response({
                    "checkout_url": checkout_url,
                    "tx_ref": payment.chapa_tx_ref
                })
            else:
                return Response({"error": "Failed to initialize Chapa payment"}, status=response.status_code)
                
        except TaxAssessment.DoesNotExist:
            return Response(status=404)

class ChapaWebhookView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        chapa_signature = request.META.get('HTTP_X_CHAPA_SIGNATURE')
        if not chapa_signature:
            return Response({"error": "Missing signature"}, status=400)
        body = request.body
        expected_sig = hmac.new(
            settings.CHAPA_WEBHOOK_SECRET.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, chapa_signature):
            return Response({"error": "Invalid signature"}, status=400)
            
        tx_ref = request.data.get('tx_ref')
        status_val = request.data.get('status')
        try:
            payment = TaxPayment.objects.get(chapa_tx_ref=tx_ref)
            if status_val == 'success':
                payment.status = 'CONFIRMED'
                from django.utils import timezone
                payment.confirmed_at = timezone.now()
                payment.save()
                
                payment.assessment.status = 'PAID'
                payment.assessment.save()
                return Response({"status": "Success"})
            elif status_val == 'failed':
                payment.status = 'FAILED'
                payment.save()
                
                from notifications.utils import notify
                notify(
                    user=payment.landlord,
                    notification_type='PAYMENT',
                    message_english=f"Your tax payment of ETB {payment.amount_etb} failed. Please try again or use PRN.",
                    message_amharic=f"የግብር ክፍያዎ (ETB {payment.amount_etb}) አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
                    is_mandatory=True
                )
                return Response({"status": "Processed as failed"})
            return Response({"status": "Ignored"})
        except TaxPayment.DoesNotExist:
            return Response(status=404)

class ReconcilePRNView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['TAX_OFFICER', 'WOREDA_OFFICER']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        prn = request.data.get('prn_code')
        try:
            payment = TaxPayment.objects.get(prn_code=prn, status='PROCESSING')
            payment.status = 'CONFIRMED'
            payment.confirmed_by = request.user
            from django.utils import timezone
            payment.confirmed_at = timezone.now()
            payment.save()
            
            payment.assessment.status = 'PAID'
            payment.assessment.save()
            
            from notifications.utils import notify
            notify(
                user=payment.landlord,
                notification_type='PAYMENT',
                message_english=f"Your PRN payment of ETB {payment.amount_etb} has been confirmed.",
                message_amharic=f"የ PRN ክፍያዎ (ETB {payment.amount_etb}) ተረጋግጧል።",
                is_mandatory=True
            )
            return Response({'status': 'Payment confirmed', 'payment_id': payment.id})
        except TaxPayment.DoesNotExist:
            return Response({'error': 'No pending payment found for this PRN'}, status=404)
"""
with codecs.open(r"idhrts_backend\payments\views.py", "w", encoding="utf-8") as f:
    f.write(content)
