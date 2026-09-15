import ipaddress
import json
import logging
import pytz
from datetime import datetime, time
from django.http import JsonResponse
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

logger = logging.getLogger(__name__)

# SRS 2.3 / NFR-REL-001: Woreda offices operate Monday-Saturday, 08:00-18:00 EAT.
OFFICE_OPENS_AT = time(8, 0)
OFFICE_CLOSES_AT = time(18, 0)
WEEKLY_REST_DAY = 6  # Sunday (datetime.weekday(): Monday=0 ... Sunday=6)


def is_allowed_government_ip(ip, allowed_entries):
    """
    True when ip matches an allowed entry. Entries may be a literal address
    ('10.0.0.4') or a CIDR network ('172.16.0.0/12') so container networks can
    be whitelisted without pinning dynamic per-container addresses.
    """
    if not ip:
        return False
    if ip in allowed_entries:
        return True
    try:
        candidate = ipaddress.ip_address(ip)
    except ValueError:
        return False
    for entry in allowed_entries:
        if '/' not in entry:
            continue
        try:
            if candidate in ipaddress.ip_network(entry, strict=False):
                return True
        except ValueError:
            logger.warning("Ignoring malformed ALLOWED_GOVERNMENT_IPS entry: %s", entry)
    return False


class GovernmentAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/') and 'auth/login' not in request.path:
            
            # E2E Test Bypass
            if getattr(settings, 'BYPASS_TIME_CHECK', False):
                return self.get_response(request)

            # Manually authenticate JWT for middleware layer
            jwt_authenticator = JWTAuthentication()
            try:
                auth_result = jwt_authenticator.authenticate(request)
                if auth_result:
                    user, token = auth_result
                    
                    if user.role in ['WOREDA_OFFICER', 'TAX_OFFICER', 'ADMIN']:
                        
                        # 1. Device Check
                        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
                        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
                            return JsonResponse({'error': 'Security Violation: Government portals cannot be accessed via mobile devices.'}, status=403)
                        
                        # 2. Time Check
                        bypass_time = getattr(settings, 'BYPASS_TIME_CHECK', False)
                        if not bypass_time:
                            tz = pytz.timezone(getattr(settings, 'TIME_ZONE', 'Africa/Addis_Ababa'))
                            now = datetime.now(tz)
                            if now.weekday() >= WEEKLY_REST_DAY:
                                return JsonResponse({'error': 'Access Denied: System locked during the weekend rest day (Sunday).'}, status=403)

                            current_time = now.time()
                            if current_time < OFFICE_OPENS_AT or current_time > OFFICE_CLOSES_AT:
                                return JsonResponse({'error': 'Access Denied: Outside working hours (Mon-Sat 08:00 - 18:00 EAT).'}, status=403)

                        # 3. IP Check
                        ip = request.META.get('HTTP_X_FORWARDED_FOR')
                        ip = ip.split(',')[0].strip() if ip else request.META.get('REMOTE_ADDR')

                        allowed_ips = getattr(settings, 'ALLOWED_GOVERNMENT_IPS', ['127.0.0.1'])
                        if not is_allowed_government_ip(ip, allowed_ips):
                            return JsonResponse({'error': f'Untrusted Network: Access from IP {ip} is blocked.'}, status=403)

            except (InvalidToken, AuthenticationFailed):
                pass # Let DRF handle standard auth errors later

        return self.get_response(request)
