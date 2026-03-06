#!/bin/bash
# ==========================================
# Ziyo ERP - Automated Deployment Script
# ==========================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration Variables
PROJECT_DIR="/var/www/ziyo-erp"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "========================================"
echo "🚀 Starting Deployment for Ziyo ERP..."
echo "========================================"

# 1. Pull Latest Source
echo "📦 1/5 Pulling the latest code from Git..."
cd $PROJECT_DIR
# git pull origin main

# 2. Build Backend
echo "⚙️ 2/5 Installing Backend dependencies & building..."
cd $BACKEND_DIR
npm install --omit=dev
npm run build

# 3. Build Frontend
echo "🎨 3/5 Installing Frontend dependencies & building..."
cd $FRONTEND_DIR
npm install
npm run build

# 4. Database Migrations (Prisma)
echo "🗄️ 4/5 Running Database Migrations..."
cd $BACKEND_DIR
npx prisma migrate deploy
npx prisma generate

# 5. Restart server gracefully with PM2
echo "🔄 5/5 Reloading PM2 processes with Zero Downtime..."
cd $BACKEND_DIR
# Start if not exists, otherwise reload without dropping active requests
pm2 reload ziyo-erp-backend || pm2 start ecosystem.config.js --env production
pm2 save

echo "========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"
