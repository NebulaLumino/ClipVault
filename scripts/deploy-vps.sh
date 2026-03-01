#!/bin/bash

# ClipVault VPS Deployment Script
# Run as: bash deploy.sh

set -e

echo "🚀 Starting ClipVault deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
echo "📦 Installing PM2..."
npm install -g pm2

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /var/www/clipvault
cd /var/www/clipvault

# Clone repository (or copy from local)
# git clone https://github.com/NebulaLumino/ClipVault.git .

# Copy application files (run this from local machine first)
echo "📝 Please ensure application files are in /var/www/clipvault"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Copy production environment file
echo "📝 Setting up environment..."
cp .env.production .env || true

# Start with PM2
echo "🚀 Starting ClipVault with PM2..."
pm2 stop clipvault 2>/dev/null || true
pm2 delete clipvault 2>/dev/null || true
pm2 start dist/index.js --name clipvault

# Setup PM2 startup script
echo "⚙️ Setting up PM2 startup..."
pm2 startup
pm2 save

echo "✅ Deployment complete!"
echo "View logs: pm2 logs clipvault"
echo "View status: pm2 status"
