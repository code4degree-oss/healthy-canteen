# Production Deployment Guide (Single VPS)

This guide walks you through deploying **The Healthy Canteen** (Frontend + Backend + Database) on a single **Ubuntu 22.04 LTS** server (DigitalOcean Droplet, AWS EC2, etc.).

> **Architecture**: In production, the **backend serves both the API and the built frontend** on a single port. Nginx sits in front as a reverse proxy for HTTPS and caching.

## Prerequisites

- A fresh Ubuntu 22.04 server with **root** access.
- A domain name pointing to your server's IP address (A Record).
- SSH access to your server.

---

## Step 1: Initial Server Setup

Login to your server and update the package list:

```bash
ssh root@your_server_ip
apt update && apt upgrade -y
```

Install essential tools:

```bash
apt install curl git unzip build-essential -y
```

---

## Step 2: Install Node.js (v20 LTS)

We will use NodeSource to install the latest LTS version.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

Verify installation:
```bash
node -v   # Should be v20.x
npm -v    # Should be v10.x
```

Install **PM2** (Process Manager) globally to keep your app running:
```bash
npm install -g pm2
```

---

## Step 3: Database Setup (PostgreSQL)

Install PostgreSQL:
```bash
apt install postgresql postgresql-contrib -y
```

Login to Postgres interactive shell:
```bash
sudo -u postgres psql
```

Create the user and database (Replace `your_secure_password`):
```sql
CREATE DATABASE healthy_canteen;
CREATE USER hct_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE healthy_canteen TO hct_admin;
\q
```

---

## Step 4: Application Setup

Clone your repository:

```bash
mkdir -p /var/www/the-healthy-canteen
cd /var/www/the-healthy-canteen
git clone <YOUR_GIT_REPO_URL> .
```
*(You may need to set up SSH keys or use HTTPS with a token if your repo is private)*

### Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### Configure Backend Environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in your production values:
```ini
PORT=5000
NODE_ENV=production

DB_NAME=healthy_canteen
DB_USER=hct_admin
DB_PASS=your_secure_password
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=<generate with: openssl rand -hex 32>
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

FRONTEND_URL=https://yourdomain.com
```

> **⚠️ IMPORTANT**: Generate a strong `JWT_SECRET` with `openssl rand -hex 32`. Never use the default fallback key.

### Build Frontend

```bash
npm run build
```
This creates a `dist/` folder with optimized static files (CSS ~10KB gzipped, JS ~145KB gzipped).

### Build Backend

```bash
cd backend
npm run build
cd ..
```
This compiles TypeScript to JavaScript in `backend/dist/`.

### Start with PM2

```bash
cd /var/www/the-healthy-canteen/backend
NODE_ENV=production pm2 start dist/server.js --name "healthy-canteen"
pm2 save
pm2 startup
```

The backend now serves both the API (`/api/*`) and the built frontend (`dist/`) on port 5000.

---

## Step 5: Nginx Configuration (Reverse Proxy)

Install Nginx:
```bash
apt install nginx -y
```

Create a new configuration for your site:
```bash
nano /etc/nginx/sites-available/healthy-canteen
```

Paste the following configuration (Replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets served by the backend
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/healthy-canteen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## Step 6: SSL/HTTPS (Certbot)

Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

Obtain an SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically update your Nginx config to force HTTPS.

---

## Step 7: DNS Configuration

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add an **A Record**:

- **Type**: A
- **Name**: @ (or www)
- **Value**: Your Server IP Address (e.g., 123.45.67.89)
- **TTL**: Automatic / 300 seconds

Wait a few minutes (or up to 24h) for propagation.

---

## Step 8: Verify Deployment

1. Visit `https://yourdomain.com` — should load the frontend
2. Visit `https://yourdomain.com/api/menu` — should return JSON menu data
3. Check backend logs: `pm2 logs healthy-canteen`

---

## Updating the App

```bash
cd /var/www/the-healthy-canteen
git pull

# Rebuild
npm install && cd backend && npm install && cd ..
npm run build
cd backend && npm run build && cd ..

# Restart
pm2 restart healthy-canteen
```

---

## Useful Commands

| Command | Description |
|---|---|
| `pm2 logs healthy-canteen` | View backend logs (real-time) |
| `pm2 restart healthy-canteen` | Restart the backend |
| `pm2 monit` | Monitor CPU/Memory usage |
| `systemctl restart nginx` | Restart Nginx |
| `certbot renew --dry-run` | Test SSL certificate renewal |
| `htop` | Monitor system resources |

---

## Security Checklist

- [x] `JWT_SECRET` set to a strong random string (not the default fallback)
- [x] `NODE_ENV=production` in backend `.env`
- [x] Helmet.js enabled (secure HTTP headers)
- [x] Rate limiting enabled (500 req / 15 min per IP)
- [x] CORS restricted to `FRONTEND_URL` in production
- [x] HTTPS enabled via Certbot
- [x] `client_max_body_size` set in Nginx (10MB for image uploads)
- [x] Image upload validation (MIME type, extension, file size)
- [x] Passwords hashed with bcrypt
