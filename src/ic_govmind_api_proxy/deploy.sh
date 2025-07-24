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
    
    # Create nginx config
    sudo tee /etc/nginx/sites-available/ic-govmind-api > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3001/api/health;
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
}

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
    echo "   http://$(curl -s http://checkip.amazonaws.com)/api/health"
    echo ""
    echo "🔧 Useful commands:"
    echo "   pm2 status                    # Check app status"
    echo "   pm2 logs ic-govmind-api-proxy # View logs"
    echo "   pm2 restart ic-govmind-api-proxy # Restart app"
    echo "   pm2 stop ic-govmind-api-proxy    # Stop app"
    echo ""
    echo "📝 Configuration files:"
    echo "   App: /opt/ic_govmind_api_proxy"
    echo "   Nginx: /etc/nginx/sites-available/ic-govmind-api"
    echo "   Logs: /var/log/ic-govmind-api-proxy*.log"
    echo ""
    echo "🔐 Don't forget to:"
    echo "   1. Edit /opt/ic_govmind_api_proxy/.env with your API keys"
    echo "   2. Update your frontend VITE_BACKEND_PROXY_URL"
    echo "   3. Consider setting up SSL with Let's Encrypt"
}

# Run main function
main 