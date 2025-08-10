#!/bin/bash

# Eazyvenue Backend Deployment Script for AWS EC2
# This script sets up the complete production environment

set -e  # Exit on any error

# Configuration
APP_NAME="eazyvenue-backend"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"
SSL_DIR="/etc/letsencrypt/live/api.eazyvenue.in"
LOG_FILE="/var/log/eazyvenue-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Function to install Node.js
install_nodejs() {
    log "Installing Node.js 18..."
    
    # Remove existing Node.js
    sudo apt-get remove -y nodejs npm || true
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    log "Node.js installed: $node_version"
    log "NPM installed: $npm_version"
}

# Function to install PM2
install_pm2() {
    log "Installing PM2..."
    sudo npm install -g pm2
    
    # Set up PM2 startup script
    sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
    
    log "PM2 installed and configured"
}

# Function to install Redis
install_redis() {
    log "Installing Redis..."
    sudo apt-get update
    sudo apt-get install -y redis-server
    
    # Configure Redis
    sudo sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    # Enable and start Redis
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    
    log "Redis installed and configured"
}

# Function to install MongoDB
install_mongodb() {
    log "Installing MongoDB..."
    
    # Import MongoDB GPG key
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # Install MongoDB
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    # Create admin user
    mongosh --eval "
    db = db.getSiblingDB('admin');
    db.createUser({
        user: 'admin',
        pwd: 'Pass_9702',
        roles: [
            { role: 'userAdminAnyDatabase', db: 'admin' },
            { role: 'readWriteAnyDatabase', db: 'admin' },
            { role: 'dbAdminAnyDatabase', db: 'admin' }
        ]
    });
    "
    
    # Enable authentication
    sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
    sudo systemctl restart mongod
    
    log "MongoDB installed and configured"
}

# Function to install Nginx
install_nginx() {
    log "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    log "Nginx installed"
}

# Function to install Certbot for SSL
install_certbot() {
    log "Installing Certbot for SSL..."
    sudo apt-get install -y snapd
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    log "Certbot installed"
}

# Function to configure SSL
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
    
    # Get SSL certificate
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@eazyvenue.in \
        -d api.eazyvenue.in
    
    # Start nginx
    sudo systemctl start nginx
    
    # Set up automatic renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    log "SSL certificate configured"
}

# Main deployment function
main() {
    log "Starting Eazyvenue backend deployment..."
    
    # Update system
    log "Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
    
    # Install dependencies
    sudo apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
    
    # Check if this is first time setup
    if ! command -v node &> /dev/null; then
        log "First time setup detected"
        install_nodejs
        install_pm2
        install_redis
        install_mongodb
        install_nginx
        install_certbot
        setup_ssl
    else
        log "Updating existing installation"
    fi
    
    log "🎉 Deployment infrastructure ready!"
}

# Run main function
main "$@"
