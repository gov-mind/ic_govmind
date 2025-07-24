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
- ✅ Configure Nginx reverse proxy
- ✅ Deploy and start the API service
- ✅ Auto-start on server reboot

### 3. Configure API Keys

After deployment, edit the environment file:

```bash
nano /opt/ic_govmind_api_proxy/.env
```

Add your actual API key:
```env
DEEPSEEK_API_KEY=your_actual_deepseek_key_here
CORS_ORIGIN=https://your-frontend-domain.com
```

Then restart the service:
```bash
pm2 restart ic-govmind-api-proxy
```

### 4. Test Your Deployment

```bash
# Check service status
pm2 status

# Test health endpoint
curl http://YOUR_SERVER_IP/api/health

# View logs
pm2 logs ic-govmind-api-proxy
```

## Management Commands

```bash
# Check status
pm2 status

# View real-time logs
pm2 logs ic-govmind-api-proxy

# Restart service
pm2 restart ic-govmind-api-proxy

# Stop service
pm2 stop ic-govmind-api-proxy

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
VITE_BACKEND_PROXY_URL=http://YOUR_SERVER_IP
```

## Optional: Setup SSL (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## File Locations

- **Application**: `/opt/ic_govmind_api_proxy/`
- **Environment**: `/opt/ic_govmind_api_proxy/.env`
- **Nginx Config**: `/etc/nginx/sites-available/ic-govmind-api`
- **Logs**: `/var/log/ic-govmind-api-proxy*.log`

## Troubleshooting

### Service won't start
```bash
# Check logs
pm2 logs ic-govmind-api-proxy

# Check if port is available
sudo netstat -tlnp | grep :3001
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
# Verify environment file
cat /opt/ic_govmind_api_proxy/.env

# Restart after changes
pm2 restart ic-govmind-api-proxy
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