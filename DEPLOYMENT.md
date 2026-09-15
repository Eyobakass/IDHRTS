# 🚀 IDHRTS Production Deployment Guide

This guide details the procedure for deploying the **Integrated Digital Housing Rental Tracking System (IDHRTS)** to a production environment (such as an AWS EC2 instance, DigitalOcean Droplet, or on-premise Ubuntu server).

## 🏗️ Architecture Overview

The production architecture is completely containerized using Docker Compose:
- **Nginx (Port 80/443)**: Reverse proxy routing traffic to Frontend, Backend, and serving static files.
- **Frontend (Next.js)**: Runs internally on port 3000.
- **Backend (Django/Gunicorn)**: Runs internally on port 8000.
- **PostgreSQL 15**: Primary relational database.
- **Redis 7**: Used for caching and Celery message brokering.
- **Celery & Celery Beat**: Asynchronous workers and scheduled background tasks.

## 📋 Prerequisites

1. A Linux server (Ubuntu 22.04 LTS recommended) with at least 4GB RAM.
2. A domain name (e.g., `idhrts.et`) pointed to the server's public IP address.
3. [Docker](https://docs.docker.com/engine/install/) and [Docker Compose V2](https://docs.docker.com/compose/install/) installed.

## ⚙️ 1. Initial Setup

### Clone the Repository
```bash
git clone https://github.com/your-org/SPM.git /opt/idhrts
cd /opt/idhrts
```

### Configure Environment Variables
Copy the production environment template to a secure `.env` file:
```bash
cp .env.example .env
nano .env
```

Ensure the following variables are securely set:
```env
# Production Keys
SECRET_KEY=your-secure-random-django-key
DEBUG=False
POSTGRES_PASSWORD=your-secure-db-password

# Domain Routing
ALLOWED_HOSTS=backend,localhost,127.0.0.1,idhrts.et
PUBLIC_BASE_URL=https://idhrts.et
FRONTEND_BASE_URL=https://idhrts.et

# Security
ALLOWED_GOVERNMENT_IPS=127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
BYPASS_TIME_CHECK=False # Keep False for strict Woreda/Tax working hours

# Third-Party Integrations
CHAPA_SECRET_KEY=CHASECK_TEST-...
CHAPA_WEBHOOK_SECRET=your-webhook-secret
AFROMESSAGE_API_KEY=your-afromessage-key
```

## 🔐 2. Let's Encrypt SSL Certificates

Before starting Nginx, use `certbot` to generate free SSL certificates for your domain.

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d idhrts.et -d www.idhrts.et
```

Update `./nginx/nginx.conf` to enable port 443 and mount the certificates in `docker-compose.yml`.

## 🚢 3. Build and Start the Stack

Pull external images and build the custom containers:
```bash
docker-compose build
docker-compose up -d
```

Verify that all 7 containers are running (`Up`) and healthy:
```bash
docker-compose ps
```

## 🛠️ 4. Initial Database Setup

Run the migrations to set up the PostgreSQL schema and run the initial database seeder to create administrative accounts:

```bash
docker-compose exec backend python manage.py migrate --noinput
docker-compose exec backend python manage.py seed_db
```

## 📄 5. View API Documentation

Once the system is live, developers and integrators can view the automated OpenAPI documentation at:
- **Swagger UI**: `https://idhrts.et/api/docs/swagger-ui/`
- **ReDoc**: `https://idhrts.et/api/docs/redoc/`
- **Raw Schema**: `https://idhrts.et/api/schema/`

## 🚨 Troubleshooting

**Backend logs (Checking 500/403 Errors):**
```bash
docker-compose logs -f backend
```

**Restarting services after code updates:**
```bash
docker-compose build backend frontend
docker-compose up -d --no-deps backend frontend
```
