# Deployment Guide

* Frontend: Vercel
* Backend: VPS (Docker + Nginx)
* Database: PostgreSQL

## Backend Foundation Notes

Required backend environment variables:

```text
APP_NAME
ENVIRONMENT
API_V1_PREFIX
DATABASE_URL
JWT_SECRET
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS
CORS_ORIGINS
PAYMENT_CURRENCY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
CASHFREE_APP_ID
CASHFREE_SECRET_KEY
CASHFREE_WEBHOOK_SECRET
```

Production must use a strong `JWT_SECRET`, must restrict `CORS_ORIGINS` to the
deployed frontend domains, must configure live payment provider credentials
before enabling online payments, and must not expose PostgreSQL publicly.
