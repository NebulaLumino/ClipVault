#!/bin/bash

# ClipVault Build and Deploy Script
# Usage: ./build-and-deploy.sh [--skip-build] [--skip-vercel] [--skip-vps]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_BUILD=false
SKIP_VERCEL=false
SKIP_VPS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-vercel)
      SKIP_VERCEL=true
      shift
      ;;
    --skip-vps)
      SKIP_VPS=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-build] [--skip-vercel] [--skip-vps]"
      echo "  --skip-build   Skip the build step"
      echo "  --skip-vercel  Skip Vercel deployment"
      echo "  --skip-vps     Skip VPS deployment"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required tools
check_dependencies() {
  log "Checking dependencies..."

  if ! command_exists npm; then
    error "npm is not installed"
    exit 1
  fi

  if ! command_exists git; then
    error "git is not installed"
    exit 1
  fi

  if [[ "$SKIP_VERCEL" == false ]] && ! command_exists vercel; then
    error "vercel CLI is not installed. Install with: npm i -g vercel"
    exit 1
  fi

  success "All dependencies found"
}

# Build the project
build_project() {
  if [[ "$SKIP_BUILD" == true ]]; then
    warning "Skipping build step"
    return
  fi

  log "Building project..."

  # Install dependencies
  log "Installing dependencies..."
  npm ci

  # Generate Prisma client
  log "Generating Prisma client..."
  npm run db:generate

  # Build backend
  log "Building TypeScript backend..."
  npm run build

  # Build frontend
  log "Building Next.js frontend..."
  npm run build:web

  success "Build completed successfully"
}

# Deploy to Vercel
deploy_vercel() {
  if [[ "$SKIP_VERCEL" == true ]]; then
    warning "Skipping Vercel deployment"
    return
  fi

  log "Deploying to Vercel..."

  # Check if we're in a git repo and have changes
  if git diff --quiet && git diff --staged --quiet; then
    log "No changes detected, deploying current state"
  else
    warning "You have uncommitted changes. Consider committing them first."
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      error "Deployment cancelled"
      exit 1
    fi
  fi

  # Deploy to Vercel
  vercel --prod

  success "Vercel deployment completed"
}

# Deploy to VPS
deploy_vps() {
  if [[ "$SKIP_VPS" == true ]]; then
    warning "Skipping VPS deployment"
    return
  fi

  log "Deploying to VPS..."

  # Check if we have VPS connection details
  if [[ -z "$VPS_HOST" ]]; then
    warning "VPS_HOST not set. Checking common locations..."

    # Try to read from .env or ask user
    if [[ -f .env ]] && grep -q "VPS_HOST" .env; then
      export $(grep "VPS_HOST" .env | xargs)
    else
      read -p "Enter VPS hostname or IP: " VPS_HOST
      export VPS_HOST
    fi
  fi

  if [[ -z "$VPS_USER" ]]; then
    VPS_USER="ubuntu"  # Default for most cloud VPS
    warning "Using default VPS_USER: $VPS_USER"
  fi

  if [[ -z "$VPS_PATH" ]]; then
    VPS_PATH="/home/$VPS_USER/github/ClipVault"
    warning "Using default VPS_PATH: $VPS_PATH"
  fi

  log "Connecting to VPS: $VPS_USER@$VPS_HOST"

  # Deploy via SSH
  ssh "$VPS_USER@$VPS_HOST" << EOF
    set -e
    cd $VPS_PATH

    echo "Pulling latest changes..."
    git pull origin main

    echo "Installing dependencies..."
    npm ci

    echo "Generating Prisma client..."
    npm run db:generate

    echo "Building backend..."
    npm run build

    echo "Restarting bot service..."
    if systemctl is-active --quiet clipvault-bot; then
      sudo systemctl restart clipvault-bot
      echo "Bot service restarted"
    else
      echo "Bot service not running, starting..."
      sudo systemctl start clipvault-bot
    fi

    echo "Checking service status..."
    sudo systemctl status clipvault-bot --no-pager -l
EOF

  success "VPS deployment completed"
}

# Git operations
git_operations() {
  log "Checking git status..."

  # Check if we're in a git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
    exit 1
  fi

  # Check for uncommitted changes
  if ! git diff --quiet || ! git diff --staged --quiet; then
    warning "You have uncommitted changes:"
    git status --porcelain

    read -p "Commit changes before deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      read -p "Enter commit message: " commit_msg
      git add .
      git commit -m "$commit_msg"

      read -p "Push to remote? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
      fi
    fi
  else
    success "Working directory is clean"
  fi
}

# Main execution
main() {
  log "Starting ClipVault deployment process..."

  check_dependencies
  git_operations
  build_project
  deploy_vercel
  deploy_vps

  success "🚀 Deployment completed successfully!"
  log "Frontend: https://clipvault.vercel.app"
  log "Backend: Running on VPS"
}

# Run main function
main "$@"