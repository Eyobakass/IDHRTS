import bcrypt
import hashlib
import io
import logging
from django.utils import timezone
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.http import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from .models import User, AuditLog, OTP

logger = logging.getLogger(__name__)

class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def _get_client_ip(self, request):
        """Extract real client IP from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def post(self, request):
        phone = request.data.get('phone_number')
        pin = request.data.get('pin')
        if not phone or not pin:
            return Response({"error": "Phone and PIN required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(phone_number=phone)
            
            # Check if user is locked
            if user.locked_until and user.locked_until > timezone.now():
                delta = user.locked_until - timezone.now()
                minutes_remaining = int(delta.total_seconds() / 60) + 1
                return Response(
                    {"error": "Account locked", "minutes_remaining": minutes_remaining},
                    status=423  # HTTP 423 Locked
                )

            # Verify bcrypt hash
            if bcrypt.checkpw(pin.encode('utf-8'), user.pin_hash.encode('utf-8')):
                # Reset lockout on successful login
                if user.failed_login_count > 0 or user.locked_until:
                    user.failed_login_count = 0
                    user.locked_until = None
                    user.save(update_fields=['failed_login_count', 'locked_until'])

                # Track session logic
                from .models import UserSession
                user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
                ip_address = self._get_client_ip(request)
                
                # Check active sessions
                active_sessions = UserSession.objects.filter(user=user, is_active=True).count()
                
                # Retrieve or create session
                session, created = UserSession.objects.get_or_create(
                    user=user,
                    device_name=user_agent[:255],
                    ip_address=ip_address,
                    defaults={'is_active': True}
                )
                
                if not created and not session.is_active:
                    session.is_active = True
                    session.save()
                    active_sessions += 1
                
                if created and active_sessions >= 3:
                    session.delete()
                    return Response({"error": "Maximum of 3 active devices reached. Revoke a session first."}, status=403)
                
                if not created:
                    session.last_active = timezone.now()
                    session.save()

                refresh = RefreshToken.for_user(user)
                refresh['role'] = user.role
                refresh['sub_city_id'] = str(user.sub_city_id) if user.sub_city_id else None
                refresh['woreda_id'] = str(user.woreda_id) if user.woreda_id else None

                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'role': user.role,
                    'requires_pin_change': user.requires_pin_change
                })
            else:
                # Invalid PIN - apply lockout logic
                from .models import SystemConfig
                from datetime import timedelta
                
                try:
                    max_attempts = int(SystemConfig.objects.get(key='LOGIN_MAX_ATTEMPTS').value)
                except (SystemConfig.DoesNotExist, ValueError):
                    max_attempts = 5
                    
                user.failed_login_count += 1
                attempts_left = max(0, max_attempts - user.failed_login_count)
                
                if user.failed_login_count >= max_attempts:
                    try:
                        lockout_duration = int(SystemConfig.objects.get(key='LOGIN_LOCKOUT_DURATION_MINUTES').value)
                    except (SystemConfig.DoesNotExist, ValueError):
                        lockout_duration = 30
                    
                    user.locked_until = timezone.now() + timedelta(minutes=lockout_duration)
                    user.save(update_fields=['failed_login_count', 'locked_until'])
                    
                    AuditLog.objects.create(
                        actor=None, action='ACCOUNT_LOCKED', target_id=user.id, target_type='User',
                        ip_address=self._get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        metadata={"reason": f"Exceeded {max_attempts} failed login attempts"}
                    )
                    return Response({"error": "Account locked", "minutes_remaining": lockout_duration}, status=423)
                
                user.save(update_fields=['failed_login_count'])

                # Log failed login attempt
                AuditLog.objects.create(
                    actor=None, action='LOGIN_FAILED', target_id=user.id, target_type='User',
                    ip_address=self._get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    metadata={"attempted_phone": phone, "reason": "Invalid PIN"}
                )
                return Response({
                    "error": "Invalid PIN", 
                    "attempts_remaining": attempts_left
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
            # Log failed login attempt for non-existent user
            AuditLog.objects.create(
                actor=None, action='LOGIN_FAILED',
                ip_address=self._get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={"attempted_phone": phone, "reason": "User not found"}
            )
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Unhandled error in %s", self.__class__.__name__)
            return Response({"error": "Internal Server Error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnlockAccountView(views.APIView):
    """Admin-only endpoint to unlock an account"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            target_user = User.objects.get(id=id)
            target_user.failed_login_count = 0
            target_user.locked_until = None
            target_user.save(update_fields=['failed_login_count', 'locked_until'])
            
            AuditLog.objects.create(
                actor=request.user, action='ACCOUNT_UNLOCKED', target_id=target_user.id, target_type='User',
                ip_address=request.META.get('REMOTE_ADDR'), user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={"reason": "Manual unlock by admin"}
            )
            return Response({"message": "Account unlocked successfully"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(views.APIView):
    """
    FR-AUTH-001 Step 1: Validates phone/role, sends OTP via SMS.
    Does NOT create account yet.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        role = request.data.get('role', 'LANDLORD')
        if role not in ['LANDLORD', 'TENANT']:
            return Response({"error": "You can only register as LANDLORD or TENANT"}, status=400)

        phone = request.data.get('phone_number')
        if not phone:
            return Response({"error": "phone_number is required"}, status=400)
        if User.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already registered"}, status=400)

        import random
        from notifications.utils import send_sms
        code = f"{random.randint(0, 999999):06d}"
        OTP.objects.create(phone_number=phone, code=code)
        try:
            send_sms(phone, f"Your IDHRTS registration OTP is {code}. It expires in 5 minutes.")
        except Exception:
            pass
        return Response({"message": "OTP sent to your phone. Verify to complete registration."}, status=200)


class RegisterVerifyView(views.APIView):
    """
    FR-AUTH-001 Step 2: Validates OTP then creates the user account.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone_number')
        otp_code = request.data.get('otp')
        pin = request.data.get('pin')
        role = request.data.get('role', 'LANDLORD')

        if not all([phone, otp_code, pin]):
            return Response({"error": "phone_number, otp, and pin are required"}, status=400)
        if role not in ['LANDLORD', 'TENANT']:
            return Response({"error": "Invalid role"}, status=400)
        if User.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already registered"}, status=400)

        otp = OTP.objects.filter(
            phone_number=phone, code=otp_code, is_used=False
        ).order_by('-created_at').first()
        if not otp or not otp.is_valid():
            return Response({"error": "Invalid or expired OTP"}, status=400)
        otp.is_used = True
        otp.save()

        pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        user = User.objects.create_user(
            phone_number=phone,
            full_name_en=request.data.get('full_name_en', ''),
            full_name_am=request.data.get('full_name_am', ''),
            role=role,
            pin_hash=pin_hash,
            tin=fayda_id
        )
        return Response({"message": "Registration complete.", "user_id": user.id}, status=201)


class OfficersListView(views.APIView):
    """Task 4: HR Admin Backend - List all officers"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get all officers (Woreda and Tax officers)
        officers = User.objects.filter(
            role__in=['WOREDA_OFFICER', 'TAX_OFFICER']
        ).values('id', 'full_name_en', 'role', 'phone_number', 'is_active')

        return Response(list(officers), status=status.HTTP_200_OK)


class DeactivateOfficerView(views.APIView):
    """Task 4: HR Admin Backend - Deactivate officer and blacklist tokens"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            officer = User.objects.get(id=id)

            # Check if officer is already inactive
            if not officer.is_active:
                return Response({"error": "Officer already deactivated"}, status=status.HTTP_400_BAD_REQUEST)

            # Deactivate the officer
            officer.is_active = False
            officer.save()

            # Blacklist all outstanding refresh tokens for this user
            outstanding_tokens = OutstandingToken.objects.filter(user=officer)
            for token in outstanding_tokens:
                # Check if already blacklisted
                if not BlacklistedToken.objects.filter(token=token).exists():
                    BlacklistedToken.objects.create(token=token)

            # Log the deactivation action
            AuditLog.objects.create(
                actor=request.user,
                action='OFFICER_DEACTIVATED',
                target_id=officer.id,
                target_type='User',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={
                    "deactivated_officer_name": officer.full_name_en,
                    "deactivated_officer_phone": officer.phone_number,
                    "deactivated_officer_role": officer.role,
                    "tokens_blacklisted": outstanding_tokens.count()
                }
            )

            return Response({
                "message": "Officer deactivated successfully",
                "officer_id": str(officer.id),
                "tokens_blacklisted": outstanding_tokens.count()
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "Officer not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Unhandled error in %s", self.__class__.__name__)
            return Response({"error": "Internal Server Error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_client_ip(self, request):
        """Extract real client IP from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GenerateIncidentReportView(views.APIView):
    """Task 2: Law Enforcement Incident Report PDF Generator"""
    permission_classes = [IsAuthenticated]

    def get(self, request, officer_id):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            officer = User.objects.get(id=officer_id)

            # Fetch all audit logs for this officer, ordered by most recent first
            audit_logs = AuditLog.objects.filter(actor=officer).order_by('-timestamp')

            # Create PDF in memory
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)

            # Container for PDF elements
            elements = []
            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                textColor=colors.HexColor('#111827'),
                spaceAfter=30,
                alignment=1,  # Center alignment
                fontName='Helvetica-Bold'
            )

            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=12,
                textColor=colors.HexColor('#1F2937'),
                spaceAfter=12,
                fontName='Helvetica-Bold'
            )

            # Title
            title = Paragraph("OFFICIAL SECURITY INCIDENT & ACTIVITY REPORT", title_style)
            elements.append(title)
            elements.append(Spacer(1, 0.2 * inch))

            # Officer Details Section
            officer_heading = Paragraph("Officer Details", heading_style)
            elements.append(officer_heading)

            officer_data = [
                ['Full Name:', officer.full_name_en],
                ['Phone Number:', officer.phone_number],
                ['Role:', officer.role],
                ['Status:', 'Active' if officer.is_active else 'Inactive'],
                ['Officer ID:', str(officer.id)]
            ]

            officer_table = Table(officer_data, colWidths=[2*inch, 4*inch])
            officer_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111827')),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB'))
            ]))
            elements.append(officer_table)
            elements.append(Spacer(1, 0.3 * inch))

            # Audit Logs Section
            logs_heading = Paragraph("Activity & Incident History", heading_style)
            elements.append(logs_heading)

            if audit_logs.exists():
                # Prepare table data
                table_data = [['Timestamp', 'Action', 'Target ID', 'IP Address']]

                for log in audit_logs:
                    table_data.append([
                        log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        log.action,
                        str(log.target_id) if log.target_id else 'N/A',
                        log.ip_address if log.ip_address else 'N/A'
                    ])

                # Create table
                logs_table = Table(table_data, colWidths=[1.5*inch, 1.5*inch, 2*inch, 1.5*inch])
                logs_table.setStyle(TableStyle([
                    # Header row styling
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('TOPPADDING', (0, 0), (-1, 0), 10),

                    # Data rows styling
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#111827')),
                    ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),

                    # Grid
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),

                    # Alternating row colors for better readability
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')])
                ]))
                elements.append(logs_table)
            else:
                no_logs_text = Paragraph("<i>No activity logs found for this officer.</i>", styles['Normal'])
                elements.append(no_logs_text)

            # Build PDF
            doc.build(elements)

            # Get PDF bytes
            pdf_bytes = buffer.getvalue()
            buffer.close()

            # Calculate SHA-256 hash for tamper evidence
            pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()

            # Create response with PDF
            response_buffer = io.BytesIO(pdf_bytes)
            response = FileResponse(
                response_buffer,
                as_attachment=True,
                filename=f'incident_report_{officer_id}.pdf',
                content_type='application/pdf'
            )

            # Add tamper evidence signature header
            response['X-Report-Signature'] = pdf_hash

            # Log the report generation
            AuditLog.objects.create(
                actor=request.user,
                action='INCIDENT_REPORT_GENERATED',
                target_id=officer.id,
                target_type='User',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={
                    "officer_name": officer.full_name_en,
                    "report_hash": pdf_hash,
                    "log_count": audit_logs.count()
                }
            )

            return response

        except User.DoesNotExist:
            return Response({"error": "Officer not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Unhandled error in %s", self.__class__.__name__)
            return Response({"error": "Internal Server Error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_client_ip(self, request):
        """Extract real client IP from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

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

        fayda_id = request.data.get('fayda_id')
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

class SystemConfigView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        from users.models import SystemConfig
        configs = SystemConfig.objects.all().values('key', 'value', 'description')
        return Response(list(configs))

    def put(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        from users.models import SystemConfig
        
        key = request.data.get('key')
        value = request.data.get('value')
        
        try:
            config = SystemConfig.objects.get(key=key)
            old_value = config.value
            config.value = str(value)
            config.save()
            
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
            if ip_address:
                ip_address = ip_address.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

            AuditLog.objects.create(
                actor=request.user,
                action='CONFIG_UPDATED',
                target_id=None,
                target_type='SystemConfig',
                ip_address=ip_address,
                metadata={'key': key, 'old_value': old_value, 'new_value': value}
            )
            return Response({"message": "Config updated successfully"})
        except SystemConfig.DoesNotExist:
            return Response({"error": "Config not found"}, status=404)

from rest_framework import viewsets
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return AuditLog.objects.none()
            
        queryset = AuditLog.objects.all().order_by('-timestamp')
        
        # FR-ADMIN-005 Filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        action = self.request.query_params.get('action')
        role = self.request.query_params.get('role')
        target_type = self.request.query_params.get('target_type')
        
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        if action:
            queryset = queryset.filter(action=action)
        if role:
            queryset = queryset.filter(actor__role=role)
        if target_type:
            queryset = queryset.filter(target_type=target_type)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        # Simple serialization
        data = []
        for log in (page if page is not None else queryset):
            data.append({
                'id': log.id,
                'timestamp': log.timestamp,
                'actor_id': log.actor_id,
                'actor_role': log.actor.role if log.actor else None,
                'actor_name': log.actor.full_name_en if log.actor else None,
                'action': log.action,
                'target_type': log.target_type,
                'target_id': log.target_id,
                'ip_address': log.ip_address,
                'metadata': log.metadata
            })
            
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

class UpdatePreferencesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        opt_in = request.data.get('sms_opt_in')
        if opt_in is not None:
            request.user.sms_opt_in = bool(opt_in)
            request.user.save(update_fields=['sms_opt_in'])
        return Response({'message': 'Preferences updated', 'sms_opt_in': request.user.sms_opt_in})

class LandlordPortfolioView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['TAX_OFFICER', 'WOREDA_OFFICER', 'ADMIN']:
            return Response({'error': 'Unauthorized'}, status=403)
        
        tin = request.query_params.get('tin')
        if not tin:
            return Response({'error': 'TIN parameter required'}, status=400)
            
        from users.models import User
        landlord = User.objects.filter(tin=tin, role='LANDLORD').first()
        if not landlord:
            return Response({'error': 'Landlord not found'}, status=404)
            
        from properties.models import Property
        from properties.serializers import PropertySerializer
        from tax.models import TaxAssessment
        from tax.serializers import TaxAssessmentSerializer
        
        properties = Property.objects.filter(owner=landlord)
        assessments = TaxAssessment.objects.filter(landlord=landlord)
        
        grand_total = sum(a.total_due_etb for a in assessments if a.status in ['PENDING', 'OVERDUE'])
        
        from users.serializers import UserSerializer
        return Response({
            'landlord': UserSerializer(landlord).data,
            'properties': PropertySerializer(properties, many=True).data,
            'assessments': TaxAssessmentSerializer(assessments, many=True).data,
            'grand_total_outstanding_etb': grand_total
        })



class FaydaMockLoginView(views.APIView):
    """
    GAP-15 (FR-AUTH-004): Mock Fayda OIDC login.
    Accepts a fayda_mock_code, matches it against stored fayda_id on User records.
    In production this would be replaced by a real Fayda OIDC callback.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        code = request.data.get('fayda_mock_code')
        if not code:
            return Response({'error': 'fayda_mock_code is required.'}, status=400)
        # fayda_id is stored as BinaryField; match against the provided code string
        try:
            import hashlib
            # Accept code as hex or direct match against fayda_id
            code_bytes = code.encode('utf-8')
            user = User.objects.filter(fayda_id=code_bytes).first()
            if not user:
                return Response({'error': 'No account linked to this Fayda ID.'}, status=404)
            if not user.is_active:
                return Response({'error': 'Account is deactivated.'}, status=403)
            refresh = RefreshToken.for_user(user)
            refresh['role'] = user.role
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': user.role,
                'user_id': str(user.id),
                'requires_pin_change': user.requires_pin_change,
            })
        except Exception as e:
            logger.error("Fayda mock login error: %s", e)
            return Response({'error': 'Authentication failed.'}, status=400)
