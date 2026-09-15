"""
Django settings for core project with environment-based configuration.
"""

from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-=yf0e+%sxc7g8l&-4ap9g^5a2pixd@+6tk%f(08khwxig(77-y')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',
    'users',
    'properties',
    'contracts',
    'tax',
    'payments',
    'disputes',
    'notifications',
    'woreda',
    'rest_framework_simplejwt.token_blacklist',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'users.middleware.GovernmentAccessMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database - support both SQLite (dev) and PostgreSQL (production)
DATABASE_ENGINE = os.getenv('DATABASE_ENGINE', 'django.db.backends.sqlite3')

if DATABASE_ENGINE == 'django.db.backends.postgresql':
    DATABASES = {
        'default': {
            'ENGINE': DATABASE_ENGINE,
            'NAME': os.getenv('DATABASE_NAME', 'idhrts_db'),
            'USER': os.getenv('DATABASE_USER', 'idhrts_user'),
            'PASSWORD': os.getenv('DATABASE_PASSWORD', ''),
            'HOST': os.getenv('DATABASE_HOST', 'localhost'),
            'PORT': os.getenv('DATABASE_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Addis_Ababa'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Generated official documents (contract PDFs, audit archives)
ARCHIVE_DIR = Path(os.getenv('ARCHIVE_DIR', BASE_DIR / 'archives'))

# Absolute base URL used when a link has to travel outside the browser (SMS).
# Empty by default so links degrade to site-relative paths in development.
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL', '').rstrip('/')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CUSTOM AUTH USER
AUTH_USER_MODEL = 'users.User'

# REST FRAMEWORK & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'IDHRTS API',
    'DESCRIPTION': 'Integrated Digital Housing Rental Tracking System API Documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OPTIONAL: Configure swagger-ui options
}

# JWT Configuration
private_key_path = os.path.join(BASE_DIR, 'private.pem')
public_key_path = os.path.join(BASE_DIR, 'public.pem')

if os.path.exists(private_key_path) and os.path.exists(public_key_path):
    # Use RS256 with actual RSA keys (local development)
    with open(private_key_path, 'rb') as f:
        PRIVATE_KEY = f.read()
    with open(public_key_path, 'rb') as f:
        PUBLIC_KEY = f.read()
    JWT_ALGORITHM = 'RS256'
else:
    # Use HS256 with SECRET_KEY (Docker/production without RSA keys)
    PRIVATE_KEY = SECRET_KEY
    PUBLIC_KEY = SECRET_KEY
    JWT_ALGORITHM = 'HS256'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'SIGNING_KEY': PRIVATE_KEY,
    'VERIFYING_KEY': PUBLIC_KEY,
    'ALGORITHM': JWT_ALGORITHM,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'JTI_CLAIM': 'jti',
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True').lower() in ('true', '1', 'yes')

# IDHRTS SETTINGS
HMAC_SECRET_KEY = os.getenv('HMAC_SECRET_KEY', 'super-secret-hmac-key')

# Chapa uses two distinct credentials (FR-PAY-001):
#   CHAPA_SECRET_KEY     -> Bearer token for outbound API calls (transaction/initialize)
#   CHAPA_WEBHOOK_SECRET -> shared secret for verifying inbound webhook HMAC signatures
CHAPA_SECRET_KEY = os.getenv('CHAPA_SECRET_KEY', '')
CHAPA_WEBHOOK_SECRET = os.getenv('CHAPA_WEBHOOK_SECRET', 'chapa-secret')

# Where Chapa sends the payer back after checkout, and where it posts the
# webhook. Both must be reachable by Chapa, so they are deployment specific.
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', '').rstrip('/')
CHAPA_RETURN_PATH = os.getenv('CHAPA_RETURN_PATH', '/payment/success')
CHAPA_CALLBACK_PATH = os.getenv('CHAPA_CALLBACK_PATH', '/api/payments/webhook/webhook/')

# Networks allowed to reach government (officer/admin) endpoints.
# Comma separated literal addresses and/or CIDR networks, e.g.
# "127.0.0.1,172.16.0.0/12". Defaults to loopback for local development.
BYPASS_TIME_CHECK = os.getenv('BYPASS_TIME_CHECK', 'False').lower() in ('true', '1', 'yes')
ALLOWED_GOVERNMENT_IPS = [
    entry.strip()
    for entry in os.getenv('ALLOWED_GOVERNMENT_IPS', '127.0.0.1').split(',')
    if entry.strip()
]

# Addis Ababa public holidays (ISO dates, comma separated) excluded from the
# 15-working-day dispute appeal window (FR-DISP-005/006).
PUBLIC_HOLIDAYS = [
    entry.strip()
    for entry in os.getenv('PUBLIC_HOLIDAYS', '').split(',')
    if entry.strip()
]

# Celery Configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')

# Celery defaults to UTC, which would silently shift every beat_schedule crontab
# by three hours. Pin it to the project timezone so schedules read as local time.
CELERY_TIMEZONE = TIME_ZONE

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # FR-NOTIF-008: SMS reminder 30 days before tax payment deadline (daily 07:00 EAT)
    'send-tax-payment-reminders': {
        'task': 'tax.tasks.send_tax_payment_reminders',
        'schedule': crontab(hour=7, minute=0),
    },
    # FR-CONT-007: Check for contracts overdue for registration (daily 08:00 EAT)
    'check-registration-deadlines': {
        'task': 'contracts.tasks.check_registration_deadlines',
        'schedule': crontab(hour=8, minute=0),
    },
    # GAP-08: Daily late payment interest compounding (FR-TAX-005)
    'compound-late-payment-interest': {
        'task': 'tax.tasks.compound_late_payment_interest',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    # FR-TAX-007: Annual tax assessment generation (1st day of Ethiopian fiscal year)
    'create-annual-assessments': {
        'task': 'tax.tasks.create_annual_assessments',
        # GAP-07: Ethiopian fiscal year starts Hamle 1 ≈ July 8 (FR-TAX-004)
        'schedule': crontab(hour=1, minute=0, day_of_month=8, month_of_year=7),
    },
}

AFROMESSAGE_RETRY_DELAY_SECONDS = 0  # Set to 30 in production deployment

