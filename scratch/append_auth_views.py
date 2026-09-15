import os

new_views = """
import random
from notifications.utils import send_sms
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

class CreateOfficerView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        role = request.data.get('role')
        if role not in ['WOREDA_OFFICER', 'TAX_OFFICER']:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        phone = request.data.get('phone_number')
        if User.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already registered"}, status=400)

        # Generate temp PIN
        temp_pin = f"{random.randint(0, 9999):04d}"
        pin_hash = bcrypt.hashpw(temp_pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

        sub_city_id = request.data.get('sub_city')
        woreda_id = request.data.get('woreda')

        user = User.objects.create_user(
            phone_number=phone,
            full_name_en=request.data.get('full_name_en', ''),
            full_name_am=request.data.get('full_name_am', ''),
            role=role,
            sub_city_id=sub_city_id,
            woreda_id=woreda_id,
            pin_hash=pin_hash,
            requires_pin_change=True
        )

        send_sms(phone, f"Welcome! Your IDHRTS temporary PIN is {temp_pin}. You must change it on first login.")
        
        return Response({"message": "Officer created successfully", "user_id": user.id}, status=201)

class RequestPinResetView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone_number')
        try:
            user = User.objects.get(phone_number=phone)
            from users.models import OTP
            code = f"{random.randint(0, 999999):06d}"
            OTP.objects.create(phone_number=phone, code=code)
            send_sms(phone, f"Your PIN reset OTP is {code}. It expires in 5 minutes.")
            return Response({"message": "OTP sent"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class ConfirmPinResetView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone_number')
        otp_code = request.data.get('otp')
        new_pin = request.data.get('new_pin')
        
        from users.models import OTP
        otp = OTP.objects.filter(phone_number=phone, code=otp_code, is_used=False).order_by('-created_at').first()
        
        if not otp or not otp.is_valid():
            return Response({"error": "Invalid or expired OTP"}, status=400)
            
        try:
            user = User.objects.get(phone_number=phone)
            otp.is_used = True
            otp.save()
            
            user.pin_hash = bcrypt.hashpw(new_pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            user.requires_pin_change = False
            user.save()
            
            # Invalidate all sessions
            from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
                
            return Response({"message": "PIN reset successfully"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class ChangePinView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_pin = request.data.get('new_pin')
        if not new_pin or len(new_pin) != 4:
            return Response({"error": "Invalid PIN"}, status=400)
            
        request.user.pin_hash = bcrypt.hashpw(new_pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        request.user.requires_pin_change = False
        request.user.save()
        return Response({"message": "PIN updated successfully"})

class SessionListView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from users.models import UserSession
        sessions = UserSession.objects.filter(user=request.user, is_active=True).values(
            'id', 'device_name', 'ip_address', 'last_active', 'created_at'
        )
        return Response(list(sessions))

class RevokeSessionView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, session_id):
        from users.models import UserSession
        try:
            session = UserSession.objects.get(id=session_id, user=request.user)
            session.is_active = False
            session.save()
            return Response({"message": "Session revoked"})
        except UserSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)
"""

with open('idhrts_backend/users/views.py', 'a') as f:
    f.write(new_views)
print("Appended new views to users/views.py")
