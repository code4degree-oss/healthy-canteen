#!/bin/bash
set -e

# =============================================================================
# VPS Setup Script — The Healthy Canteen
# =============================================================================
# This script installs all dependencies needed for the application:
# 1. Node.js 20 (LTS)
# 2. PM2 (Process Manager)
# 3. Nginx (Web Server)
# 4. PostgreSQL (Database)
# 5. Certbot (SSL)
# =============================================================================

echo "🚀 Starting VPS Setup..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
echo "🟢 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# 3. Install PM2
echo "Process Manager installing..."
sudo npm install -g pm2

# 4. Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 6. Install Certbot
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 7. Create Application Directory
echo "📂 Creating app directory..."
sudo mkdir -p /var/www/the-healthy-canteen
sudo chown -R $USER:$USER /var/www/the-healthy-canteen

echo "✅ Setup complete! Next steps:"
echo "1. Configure PostgreSQL user/db"
echo "2. Clone the repo into /var/www/the-healthy-canteen"
echo "3. Add .env files"
echo "4. Run 'npm install' and 'npm run build'"
