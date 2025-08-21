#!/bin/bash

# IC GovMind API Proxy - Server Deployment
# Simple deployment script for VPS servers

set -e

echo "🚀 IC GovMind API Proxy - Server Deployment"
echo "==========================================="

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root. Consider creating a dedicated user for security."
fi

# Install Node.js if not present
install_nodejs() {
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
}

# Install PM2 for process management
install_pm2() {
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
}

# Setup firewall
setup_firewall() {
    echo "🔥 Setting up firewall..."
    sudo ufw allow ssh
    sudo ufw allow 3001/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "y" | sudo ufw enable
    echo "✅ Firewall configured"
}

# Setup nginx reverse proxy
setup_nginx() {
    echo "🌐 Setting up Nginx reverse proxy..."
    
    sudo apt-get update
    sudo apt-get install -y nginx
    
    # Get domain name for SSL setup
    echo ""
    echo "🔐 SSL Certificate Setup"
    echo "======================"
    echo "For SSL support, you need a domain name pointing to this server."
    echo "If you don't have a domain, the server will run on HTTP only."
    echo ""
    read -p "Enter your domain name (e.g., api.yourdomain.com) or press Enter to skip SSL: " DOMAIN_NAME
    
    if [ -z "$DOMAIN_NAME" ]; then
        echo "⚠️  Skipping SSL setup - server will run on HTTP only"
        SERVER_NAME="_"
        SSL_CONFIG=""
    else
        echo "🔍 Setting up SSL for domain: $DOMAIN_NAME"
        SERVER_NAME="$DOMAIN_NAME"
        SSL_CONFIG="# SSL will be configured by Certbot"
    fi
    
    # Create nginx config
    sudo tee /etc/nginx/sites-available/ic-govmind-api > /dev/null << EOF
server {
    listen 80;
    listen [::]:80; # IPv6
    server_name $SERVER_NAME;
    $SSL_CONFIG

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to idempotent-proxy-server (port 8080)
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:8080/api/health;
        access_log off;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/ic-govmind-api /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    sudo nginx -t
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configured and running"
    
    # Setup SSL if domain was provided
    if [ ! -z "$DOMAIN_NAME" ]; then
        setup_ssl "$DOMAIN_NAME"
    fi
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    local domain=$1
    echo "🔐 Setting up SSL certificate for $domain..."
    
    # Install Certbot
    sudo apt-get install -y certbot python3-certbot-nginx
    
    # Verify domain points to this server
    echo "🔍 Verifying domain configuration..."
    SERVER_IP=$(curl -s http://checkip.amazonaws.com)
    DOMAIN_IP=$(dig +short $domain | tail -n1)
    
    if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
        echo "⚠️  WARNING: Domain $domain does not point to this server!"
        echo "   Server IP: $SERVER_IP"
        echo "   Domain IP: $DOMAIN_IP"
        echo ""
        echo "Please update your DNS records to point $domain to $SERVER_IP"
        read -p "Continue with SSL setup anyway? (y/N): " CONTINUE_SSL
        if [ "$CONTINUE_SSL" != "y" ] && [ "$CONTINUE_SSL" != "Y" ]; then
            echo "⏭️  Skipping SSL setup. You can run it later with:"
            echo "   sudo certbot --nginx -d $domain"
            return
        fi
    fi
    
    # Get SSL certificate
    echo "📜 Obtaining SSL certificate..."
    sudo certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain --redirect
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate installed successfully!"
        
        # Setup auto-renewal
        echo "🔄 Setting up automatic certificate renewal..."
        # Check if certbot renewal cron job already exists
        if ! sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
            (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
            echo "✅ Auto-renewal cron job added"
        else
            echo "✅ Auto-renewal cron job already exists"
        fi
        
        echo "✅ Auto-renewal configured"
        echo "🌐 Your API is now available at: https://$domain"
    else
        echo "❌ SSL certificate installation failed"
        echo "   Your API is still available at: http://$domain"
        echo "   You can try SSL setup later with: sudo certbot --nginx -d $domain"
    fi
}

# Deploy the application
deploy_app() {
    echo "🚀 Deploying application..."
    
    # Create app directory
    APP_DIR="/opt/ic_govmind_api_proxy"
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    
    # Copy files
    echo "📁 Copying files to $APP_DIR..."
    cp -r * $APP_DIR/
    cd $APP_DIR
    
    # Debug: List copied files
    echo "📋 Files in $APP_DIR:"
    ls -la
    
    # Install dependencies
    npm install --production
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env file..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "✅ .env file created from .env.example"
        else
            echo "⚠️  .env.example not found, creating basic .env file..."
            cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3001

# API Keys (REQUIRED - Replace with your actual key)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# CORS - Allow your frontend domains
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate limiting (requests per 15 minutes per IP)
RATE_LIMIT_MAX=100
EOF
            echo "✅ Basic .env file created"
        fi
        echo ""
        echo "⚠️  IMPORTANT: Edit the .env file with your API keys:"
        echo "   nano $APP_DIR/.env"
        echo ""
        read -p "Press Enter after you've edited the .env file..."
    fi
    
    # Create PM2 ecosystem file (CommonJS format for PM2 compatibility)
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'ic-govmind-api-proxy',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/ic-govmind-api-proxy-error.log',
    out_file: '/var/log/ic-govmind-api-proxy-out.log',
    log_file: '/var/log/ic-govmind-api-proxy.log'
  }]
};
EOF

    # Start with PM2
    pm2 start ecosystem.config.cjs
    pm2 save
    pm2 startup
    
    echo "✅ Application deployed and running"
    echo "📝 Note: This PM2 service runs behind the idempotent-proxy-server on port 8080"
}

# Global variables
DOMAIN_NAME=""

# Main installation flow
main() {
    echo "Starting server setup..."
    
    # Update system
    echo "📦 Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        install_nodejs
    else
        echo "✅ Node.js already installed: $(node --version)"
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        install_pm2
    else
        echo "✅ PM2 already installed"
    fi
    
    # Setup firewall
    setup_firewall
    
    # Setup nginx
    setup_nginx
    
    # Deploy application
    deploy_app
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "📍 Your API is running at:"
    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "   https://$DOMAIN_NAME/api/health (SSL enabled)"
        echo "   http://$DOMAIN_NAME/api/health (HTTP fallback)"
    else
        echo "   http://$(curl -s http://checkip.amazonaws.com)/api/health"
    fi
    echo ""
    echo "🔧 Useful commands:"
    echo "   pm2 status                    # Check PM2 app status"
    echo "   pm2 logs ic-govmind-api-proxy # View PM2 logs"
    echo "   pm2 restart ic-govmind-api-proxy # Restart PM2 app"
    echo "   pm2 stop ic-govmind-api-proxy    # Stop PM2 app"
    echo "   systemctl status idempotent-proxy-server  # Check proxy server status"
    echo "   systemctl restart idempotent-proxy-server # Restart proxy server"
    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "   sudo certbot certificates     # Check SSL status"
        echo "   sudo certbot renew --dry-run # Test SSL renewal"
    fi
    echo ""
    echo "📝 Configuration files:"
    echo "   App: /opt/ic_govmind_api_proxy"
    echo "   Nginx: /etc/nginx/sites-available/ic-govmind-api"
    echo "   Logs: /var/log/ic-govmind-api-proxy*.log"
    echo ""
    echo "🔐 Don't forget to:"
    echo "   1. Edit /opt/ic_govmind_api_proxy/.env with your API keys (PM2 service)"
    echo "   2. Edit /mnt/idempotent-server/.env for proxy server configuration"
    echo "   3. Restart proxy server after env changes: systemctl restart idempotent-proxy-server"
    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "   4. Update your frontend VITE_BACKEND_PROXY_URL=https://$DOMAIN_NAME"
        echo "   5. SSL certificate will auto-renew (check with: sudo certbot certificates)"
    else
        echo "   4. Update your frontend VITE_BACKEND_PROXY_URL=http://$(curl -s http://checkip.amazonaws.com)"
        echo "   5. Consider setting up SSL later with: sudo certbot --nginx -d your-domain.com"
    fi
}

# Run main function
main