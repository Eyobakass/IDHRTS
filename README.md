# Integrated Digital Housing Rental Tracking System (IDHRTS)

IDHRTS is a comprehensive, fully containerized government portal for managing, registering, and tracking housing rental contracts and property taxes.

## Key Features
- **Landlord & Tenant Portals**: Digital property registration, contract creation, and OTP-based digital signatures.
- **Woreda Officer Portal**: Automated property verification and dispute management.
- **Tax Officer Portal**: SIGTAS-compliant CSV exports, Chapa payment integrations, and tax assessment generation.

## 🚀 Quick Start (Development)

Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up -d
```

This will automatically start:
- **Next.js Frontend**: http://localhost
- **Django Backend**: http://localhost/api
- **PostgreSQL Database**
- **Redis Cache**
- **Celery Workers & Beat Scheduler**

## 📚 API Documentation

Once the application is running, the interactive API documentation is available at:
- **Swagger UI**: http://localhost/api/docs/swagger-ui/
- **ReDoc**: http://localhost/api/docs/redoc/

## 🚢 Production Deployment

For production deployments (AWS, DigitalOcean, Ubuntu), please see the [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

## 🧪 Testing

The system includes an exhaustive Playwright E2E testing suite that validates the full system architecture against the real database.

```powershell
cd idhrts_frontend
npm run test:real
```
