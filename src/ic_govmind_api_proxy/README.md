# IC GovMind API Proxy Deployment Guide

Simple deployment guide for IC GovMind API Proxy on your VPS server.

## Prerequisites

- Fresh Ubuntu 20.04+ server (Linode, DigitalOcean, etc.)
- Root or sudo access
- DeepSeek API key
- `rsync` installed locally (recommended) or `tar` for file compression

## Quick Deployment

### 1. Upload Files to Your Server

```bash
# Option A: Using rsync (recommended - fastest)
rsync -av --exclude='node_modules' --exclude='.env' src/ic_govmind_api_proxy/ root@YOUR_SERVER_IP:/tmp/ic_govmind_api_proxy/

# Option B: Using tar + scp (if rsync not available)
tar --exclude='node_modules' --exclude='.env' -czf api_proxy.tar.gz src/ic_govmind_api_proxy/
scp api_proxy.tar.gz root@YOUR_SERVER_IP:/tmp/
ssh root@YOUR_SERVER_IP "cd /tmp && tar -xzf api_proxy.tar.gz && mv src/ic_govmind_api_proxy ic_govmind_api_proxy"

# Option C: Using scp with manual exclusions (basic)
scp -r src/ic_govmind_api_proxy root@YOUR_SERVER_IP:/tmp/ 
# Note: This uploads everything including node_modules (slow but works)

# SSH into your server
ssh root@YOUR_SERVER_IP
```

### 2. Run the Deployment Script

```bash
# Navigate to the uploaded directory
cd /tmp/ic_govmind_api_proxy

# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

**Note**: The deployment script will automatically run `npm install` to download dependencies on the server, so you don't need to upload `node_modules` (which can be 100MB+).

**Files uploaded**: `server.js`, `package.json`, `.env.example`, `deploy.sh`, `test/`, etc.
**Files excluded**: `node_modules/`, `.env` (contains secrets), logs, IDE files

The script will:
- ✅ Install Node.js 18.x
- ✅ Install PM2 process manager
- ✅ Setup UFW firewall
- ✅ Configure Nginx reverse proxy (delegates to idempotent-proxy-server on port 8080)
- ✅ Setup SSL certificate with Let's Encrypt (if domain provided)
- ✅ Deploy and start the API service with PM2
- ✅ Auto-start on server reboot
- ✅ Configure automatic SSL certificate renewal

**Architecture**: Nginx → idempotent-proxy-server (port 8080) → PM2 service (port 3001)

### 3. Configure Environment Variables

After deployment, you need to configure two environment files:

**A. PM2 Service Configuration:**
```bash
nano /opt/ic_govmind_api_proxy/.env
```

Add your actual API key:
```env
DEEPSEEK_API_KEY=your_actual_deepseek_key_here
CORS_ORIGIN=https://your-frontend-domain.com
```

**B. Idempotent Proxy Server Configuration:**
```bash
nano /mnt/idempotent-server/.env
```

Configure proxy server settings as needed.

**Restart Services After Changes:**
```bash
# Restart PM2 service
pm2 restart ic-govmind-api-proxy

# Restart idempotent proxy server
sudo systemctl restart idempotent-proxy-server
```

### 4. Test Your Deployment

```bash
# Check service status
pm2 status

# Test health endpoint (HTTP)
curl http://YOUR_SERVER_IP/api/health

# Test health endpoint (HTTPS - if SSL configured)
curl https://your-domain.com/api/health

# View logs
pm2 logs ic-govmind-api-proxy

# Check SSL certificate (if configured)
sudo certbot certificates
```

## Management Commands

### PM2 Service (Backend API)
```bash
# Check PM2 status
pm2 status

# View real-time logs
pm2 logs ic-govmind-api-proxy

# Restart PM2 service
pm2 restart ic-govmind-api-proxy

# Stop PM2 service
pm2 stop ic-govmind-api-proxy
```

### Idempotent Proxy Server (Port 8080)
```bash
# Check proxy server status
sudo systemctl status idempotent-proxy-server

# Restart proxy server
sudo systemctl restart idempotent-proxy-server

# Stop proxy server
sudo systemctl stop idempotent-proxy-server

# View proxy server logs
sudo journalctl -u idempotent-proxy-server -f
```

### System Services
```bash
# Check nginx status
sudo systemctl status nginx

# Check firewall status
sudo ufw status
```

## Frontend Configuration

Update your frontend environment:

```env
# .env.production
VITE_USE_BACKEND_PROXY=true

# Use HTTPS if SSL was configured
VITE_BACKEND_PROXY_URL=https://your-domain.com

# Or HTTP if no SSL
VITE_BACKEND_PROXY_URL=http://YOUR_SERVER_IP
```

## SSL Certificate (Automatic)

The deployment script now automatically handles SSL setup:

1. **During deployment**, you'll be prompted for a domain name
2. **If provided**, the script will:
   - Install Certbot and dependencies
   - Verify your domain points to the server
   - Obtain and install SSL certificate
   - Configure automatic renewal
   - Redirect HTTP to HTTPS

**Requirements for SSL:**
- A domain name (e.g., `api.yourdomain.com`)
- DNS A record pointing to your server's IP
- Port 80 and 443 open (handled by firewall setup)

**Manual SSL setup** (if needed later):
```bash
sudo certbot --nginx -d your-domain.com
```

## File Locations

- **PM2 Application**: `/opt/ic_govmind_api_proxy/`
- **PM2 Environment**: `/opt/ic_govmind_api_proxy/.env`
- **Proxy Server Environment**: `/mnt/idempotent-server/.env`
- **Nginx Config**: `/etc/nginx/sites-available/ic-govmind-api`
- **PM2 Logs**: `/var/log/ic-govmind-api-proxy*.log`
- **Proxy Server Logs**: `sudo journalctl -u idempotent-proxy-server`

## Troubleshooting

### Service won't start
```bash
# Check PM2 logs
pm2 logs ic-govmind-api-proxy

# Check proxy server logs
sudo journalctl -u idempotent-proxy-server -f

# Check if ports are available
sudo netstat -tlnp | grep :3001  # PM2 service
sudo netstat -tlnp | grep :8080  # Proxy server
```

### Upload/deployment issues
```bash
# If .env.example missing during deployment
ls -la /tmp/ic_govmind_api_proxy/  # Check what files were uploaded

# If files missing, re-upload with correct path
rsync -av --exclude='node_modules' src/ic_govmind_api_proxy/ root@YOUR_SERVER_IP:/tmp/ic_govmind_api_proxy/

# Check deployment script has files it needs
cd /tmp/ic_govmind_api_proxy && ls -la
```

### API keys not working
```bash
# Verify PM2 environment file
cat /opt/ic_govmind_api_proxy/.env

# Verify proxy server environment file
cat /mnt/idempotent-server/.env

# Restart services after changes
pm2 restart ic-govmind-api-proxy
sudo systemctl restart idempotent-proxy-server
```

### Nginx issues
```bash
# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Firewall blocking connections
```bash
# Check firewall status
sudo ufw status

# Allow specific ports if needed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Security Notes

- ✅ API keys stored securely on server
- ✅ Firewall configured with minimal open ports  
- ✅ Nginx reverse proxy with security headers
- ✅ PM2 process management with auto-restart
- ⚠️ Consider setting up SSL/TLS for production
- ⚠️ Regularly update system packages

## Cost Estimate

- **Linode Nanode 1GB**: $5/month
- **Linode Shared CPU 2GB**: $10/month (recommended)

Perfect for handling hundreds of AI analysis requests per day!