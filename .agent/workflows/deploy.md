---
description: How to deploy the application to a VPS
---

# VPS Deployment Workflow

This deploys the full stack (frontend + backend + DB) on a single VPS.

## Prerequisites
- Ubuntu/Debian VPS with Node.js 18+ and PostgreSQL installed
- A domain name pointed to your VPS IP

## Steps

### 1. Clone and install dependencies
```bash
git clone <repo-url> /opt/healthy-canteen
cd /opt/healthy-canteen
npm install
cd backend && npm install && cd ..
```

### 2. Set up PostgreSQL
```bash
sudo -u postgres psql -c "CREATE DATABASE healthy_canteen;"
sudo -u postgres psql -c "CREATE USER canteen_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE healthy_canteen TO canteen_user;"
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Fill in:
- `DB_NAME=healthy_canteen`
- `DB_USER=canteen_user`
- `DB_PASS=your_secure_password`
- `JWT_SECRET=` (generate with `openssl rand -hex 32`)
- `NODE_ENV=production`
- `FRONTEND_URL=https://yourdomain.com`

### 4. Build the frontend
```bash
npm run build
```
This creates `dist/` with optimized static files.

### 5. Build the backend
```bash
cd backend
npm run build
```
This compiles TypeScript to `backend/dist/`.

### 6. Start with PM2
```bash
npm install -g pm2
cd /opt/healthy-canteen/backend
NODE_ENV=production pm2 start dist/server.js --name healthy-canteen
pm2 save
pm2 startup
```

### 7. Set up Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

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
}
```

### 8. Enable HTTPS with Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 9. Verify
- Visit https://yourdomain.com — should load the frontend
- Visit https://yourdomain.com/api/menu — should return JSON menu data

## Updating
```bash
cd /opt/healthy-canteen
git pull
npm install && cd backend && npm install && cd ..
npm run build
cd backend && npm run build && cd ..
pm2 restart healthy-canteen
```
