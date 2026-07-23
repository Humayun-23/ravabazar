# Ravabazar Client Handover Document

Welcome to your new custom e-commerce platform! This document outlines everything you need to take ownership of the Ravabazar application.

## 1. Tech Stack Overview

- **Frontend (Web/PWA)**: Built with Next.js (React), TailwindCSS, and Zustand for state management. Deployed on Vercel.
- **Backend (API)**: Built with FastAPI (Python), SQLAlchemy, and Pydantic. Deployed via Docker.
- **Database**: PostgreSQL database.
- **Integrations Supported**:
  - Payment Gateways: Razorpay, Cashfree
  - Shipping/Logistics: Shiprocket
  - Media Storage: Cloudinary
  - Email/Notifications: Mailtrap, Firebase Cloud Messaging (Push Notifications)
  - Authentication: Custom JWT, Google OAuth

## 2. Accessing the Application

### Customer Facing (Frontend)
- **URL**: `https://ravabazar.com` *(Update this with your actual domain)*
- Customers can sign up via Email/Phone or use Google Single Sign-On.

### Admin Dashboard
- **URL**: `https://ravabazar.com/admin/login`
- The admin panel allows you to manage Products, Categories, Orders, Customers, Banners, Coupons, and Reviews.

## 3. Initial Setup & Credentials

Before launching to the public, ensure your server administrator has properly configured all the environment variables in the backend `.env` file (see `docs/deployment.md` for a full list).

### Creating your first Admin Account
Because admin accounts have full control over the store, there is no public sign-up for them. To create your first admin account, your server administrator must run the following command directly on the backend server:

```bash
docker-compose exec backend python -m scripts.create_admin --email your@email.com --password your_secure_password
```

Once created, you can log in at `/admin/login`.

## 4. Key Features to Note

- **Product Reviews**: Only customers who have actually purchased an item can leave a review for it. You can manage and delete reviews from the Admin Dashboard.
- **Real-Time Location**: The app can detect the user's location to serve localized content. The user must manually click the location pin in the navigation bar to grant permission.
- **Order Protection**: Inventory is securely validated at checkout. Payments are cryptographically verified via webhooks to prevent fraud.

## 5. Maintenance & Support

- **Codebase**: Your full source code is located in the GitHub repository. The `frontend` and `backend` folders operate independently.
- **Documentation**: Refer to the `/docs` folder in the repository for detailed architectural plans, database schemas, and API contracts.

Congratulations on your new platform!
