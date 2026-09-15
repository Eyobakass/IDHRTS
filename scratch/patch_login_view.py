import re

with open('idhrts_backend/users/views.py', 'r') as f:
    content = f.read()

login_func_old = """            # Generate JWT
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            refresh['role'] = user.role"""

login_func_new = """            # Device fingerprinting
            device_name = request.META.get('HTTP_USER_AGENT', 'Unknown Device')[:250]
            ip_address = self._get_client_ip(request)
            fingerprint = bcrypt.hashpw(f"{device_name}{ip_address}".encode('utf-8'), bcrypt.gensalt(4)).decode('utf-8')
            
            from .models import UserSession
            active_sessions = UserSession.objects.filter(user=user, is_active=True).count()
            if active_sessions >= 3:
                return Response({"error": "Maximum of 3 active devices reached. Please revoke a session first."}, status=403)
                
            UserSession.objects.create(
                user=user,
                device_fingerprint=fingerprint,
                device_name=device_name,
                ip_address=ip_address
            )

            # Generate JWT
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            refresh['role'] = user.role
            refresh['requires_pin_change'] = user.requires_pin_change"""

login_response_old = """            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'full_name_en': user.full_name_en,
                    'role': user.role,
                    'sub_city': user.sub_city.id if user.sub_city else None,
                    'woreda': user.woreda.id if user.woreda else None
                }
            })"""

login_response_new = """            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'requires_pin_change': user.requires_pin_change,
                'user': {
                    'id': user.id,
                    'full_name_en': user.full_name_en,
                    'role': user.role,
                    'sub_city': user.sub_city.id if user.sub_city else None,
                    'woreda': user.woreda.id if user.woreda else None
                }
            })"""

if login_func_old in content:
    content = content.replace(login_func_old, login_func_new)
if login_response_old in content:
    content = content.replace(login_response_old, login_response_new)

with open('idhrts_backend/users/views.py', 'w') as f:
    f.write(content)
print("Patched LoginView")
