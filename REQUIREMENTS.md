# Project Requirements & Setup Guide

This document outlines the system requirements, dependencies, and environment configuration necessary to run **The Healthy Canteen**.

## 1. System Requirements

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | v18.0.0+ (Recommended: v20.x LTS) | Runtime for both frontend build and backend |
| **npm** | v9.0.0+ | Included with Node.js |
| **PostgreSQL** | v14+ | Primary database |
| **OS** | Windows, macOS, or Linux | Development: any. Production: Ubuntu 22.04 LTS recommended |

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 6, TypeScript 5.8, Tailwind CSS 3 |
| **Backend** | Node.js, Express 4, TypeScript 5.4 |
| **Database ORM** | Sequelize 6 (PostgreSQL) |
| **Auth** | JWT (7-day expiry), Google OAuth (`@react-oauth/google` + `google-auth-library`) |
| **Image Processing** | Sharp (compression + thumbnail generation) |
| **Security** | Helmet, express-rate-limit (500 req/15min), bcryptjs, CORS |
| **Process Manager** | PM2 (production) |

## 3. Dependencies

### Frontend (`/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.4 | UI Library |
| `react-dom` | ^19.2.4 | React DOM Renderer |
| `react-router-dom` | ^7.13.0 | Client-side Routing |
| `axios` | ^1.13.4 | HTTP Client |
| `lucide-react` | ^0.563.0 | Icons |
| `@react-oauth/google` | ^0.13.4 | Google Login |
| `@dnd-kit/core` | ^6.3.1 | Drag & Drop (Menu Reordering) |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable Lists |
| `@dnd-kit/utilities` | ^3.2.2 | DnD Utilities |

**Dev Dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^6.2.0 | Build Tool & Dev Server |
| `@vitejs/plugin-react` | ^5.0.0 | React Support for Vite |
| `typescript` | ~5.8.2 | Static Typing |
| `tailwindcss` | ^3.x | Utility-First CSS Framework |
| `postcss` | latest | CSS Transformation Pipeline |
| `autoprefixer` | latest | Vendor Prefix Automation |

### Backend (`/backend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.19.2 | Web Framework |
| `sequelize` | ^6.37.3 | ORM for PostgreSQL |
| `pg` / `pg-hstore` | ^8.11.5 | PostgreSQL Client |
| `bcryptjs` | ^3.0.3 | Password Hashing |
| `jsonwebtoken` | ^9.0.3 | Auth Tokens (JWT) |
| `multer` | ^2.0.2 | File Uploads |
| `sharp` | ^0.34.5 | Image Compression & Thumbnails |
| `helmet` | ^8.1.0 | Secure HTTP Headers |
| `compression` | ^1.8.1 | Gzip Response Compression |
| `express-rate-limit` | ^8.2.1 | API Rate Limiting |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^16.4.5 | Environment Variables |
| `google-auth-library` | ^10.5.0 | Google OAuth (Server-side) |

## 4. Environment Configuration

### Frontend (`.env.local` — project root)

```ini
# Google Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend API URL (defaults to http://localhost:5000/api if not set)
VITE_API_URL=http://localhost:5000/api
```

> **Production**: A `.env.production` file is already configured with `VITE_API_URL=/api` so the frontend calls the same origin.

### Backend (`backend/.env`)

```ini
# Server
PORT=5000
NODE_ENV=development

# Database
DB_NAME=healthy_canteen
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432

# Authentication
JWT_SECRET=your_secure_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend URL (for CORS — comma-separated for multiple origins)
FRONTEND_URL=http://localhost:3000
```

> **Template available**: Copy `backend/.env.example` to `backend/.env` and fill in values.

## 5. Installation & Running

### Install Dependencies
```bash
# Frontend (root directory)
npm install

# Backend
cd backend && npm install && cd ..
```

### Start Development Servers
```bash
# Terminal 1 — Frontend (port 3000)
npm run dev

# Terminal 2 — Backend (port 5000)
cd backend && npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build
```bash
# Build frontend → dist/
npm run build

# Build backend → backend/dist/
cd backend && npm run build && cd ..

# Start production server (serves both frontend and API on port 5000)
cd backend && NODE_ENV=production node dist/server.js
```

## 6. Project Structure

```
├── index.html              # HTML entry point
├── index.tsx               # React entry point
├── App.tsx                 # Main app with routing
├── types.ts                # Shared TypeScript interfaces
├── constants.ts            # App-wide constants
├── tailwind.config.js      # Tailwind CSS theme config
├── postcss.config.js       # PostCSS plugins
├── vite.config.ts          # Vite build config
├── .env.production         # Vite production env (VITE_API_URL=/api)
│
├── src/
│   ├── index.css           # Tailwind directives + custom styles
│   └── services/
│       └── api.ts          # API client (axios)
│
├── components/
│   ├── AdminDashboard.tsx  # Admin panel (customers, menu, delivery, settings)
│   ├── ClientDashboard.tsx # Customer view (subscriptions, add-ons)
│   ├── DeliveryDashboard.tsx # Driver view (queue, history, no-receive)
│   ├── OrderFlowPage.tsx   # Multi-step order creation
│   ├── OrderFlowModal.tsx  # Quick order modal
│   ├── ErrorBoundary.tsx   # React error boundary
│   └── admin/
│       ├── AdminOverview.tsx
│       ├── AdminCustomerList.tsx
│       ├── AdminNotificationsView.tsx
│       └── SortableMenuTable.tsx
│
├── backend/
│   ├── .env.example        # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts       # Express app + production static serving
│       ├── config/
│       │   └── database.ts # Sequelize configuration
│       ├── middleware/
│       │   └── authMiddleware.ts # JWT + role-based auth
│       ├── models/
│       │   ├── User.ts, Order.ts, Subscription.ts
│       │   ├── Plan.ts, MenuItem.ts, AddOn.ts
│       │   ├── DeliveryLog.ts, Settings.ts, Notification.ts
│       │   └── index.ts    # Associations
│       ├── controllers/
│       │   ├── authController.ts     # Register, Login, Google OAuth
│       │   ├── orderController.ts    # Create/Get orders
│       │   ├── adminController.ts    # Admin CRUD operations
│       │   ├── deliveryController.ts # Queue, confirm, no-receive, history
│       │   └── menuController.ts     # Plans, menu items, add-ons
│       ├── routes/
│       │   ├── authRoutes.ts, orderRoutes.ts
│       │   ├── adminRoutes.ts, deliveryRoutes.ts
│       │   ├── menuRoutes.ts, settingsRoutes.ts
│       │   ├── subscriptionRoutes.ts, notificationRoutes.ts
│       └── utils/
│           └── fileUpload.ts # Multer, Sharp compression, thumbnail generation
│
└── PRODUCTION_GUIDE.md     # VPS deployment instructions
```

## 7. Hardware Recommendations

### Minimum (Testing / Low Traffic)
- **vCPU**: 1 Core
- **RAM**: 2 GB (swap file recommended)
- **Storage**: 25 GB SSD

### Standard Production (1k-10k users/day)
| Component | Spec | Notes |
|---|---|---|
| **vCPU** | 2 cores | Node.js event loop + DB queries |
| **RAM** | 4 GB | PostgreSQL ~2GB cache + Node ~1GB |
| **Storage** | 50–100 GB SSD | OS + DB + uploaded images |
| **Bandwidth** | 4–5 TB | Standard transfer limits |

### High Scale (50k+ users)
Separate the services:
1. **App Server**: 2+ vCPU / 4 GB RAM (horizontal scaling)
2. **DB Server**: Managed PostgreSQL (4 GB+ RAM)
3. **Storage**: AWS S3 or Google Cloud Storage for images

## 8. Key Features

| Feature | Description |
|---|---|
| **Meal Plans** | Configurable protein type, duration (1–30 days), meals per day |
| **Add-ons** | Kefir, cookies, etc. — with daily/one-time frequency options |
| **Google Maps** | Service area validation, delivery location picker |
| **Admin Dashboard** | Customer management, menu editing, delivery assignment, kitchen prep, notifications |
| **Delivery Dashboard** | Queue view, confirm delivery, "No One to Receive" status, date-filtered history |
| **Image System** | Upload, auto-compression (Sharp), thumbnail generation, per-item image removal |
| **Auth** | Email/password + Google OAuth, role-based access (admin, client, delivery) |
| **Notifications** | Push notification system with read/unread tracking |
