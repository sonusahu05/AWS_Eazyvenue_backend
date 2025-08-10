# 🚀 Eazyvenue Backend Deployment Guide

## ✅ Prerequisites

1. **AWS EC2 Server Ready**: `13.61.182.152`
2. **Domain Configured**: `api.eazyvenue.in` pointing to EC2 IP
3. **SSH Key Available**: `eazyvenue-key-new.pem`
4. **GitHub Repository**: Backend code at `sonusahu05/AWS_Eazyvenue_backend`

## 🔐 Step 1: Setup GitHub Secrets

1. Go to: `https://github.com/sonusahu05/AWS_Eazyvenue_backend/settings/secrets/actions`
2. Add all secrets from `GITHUB_SECRETS_SETUP.md`
3. **Critical**: Make sure to add your GitHub Personal Access Token as `ACCESS_TOKEN`

## 🚀 Step 2: Deploy

### Option A: Push to Main Branch (Automatic)
```bash
git add .
git commit -m "Deploy backend to production"
git push origin main
```

### Option B: Manual Trigger
1. Go to: `https://github.com/sonusahu05/AWS_Eazyvenue_backend/actions`
2. Select "Deploy Eazyvenue Backend to AWS EC2"
3. Click "Run workflow"

## 📊 Step 3: Monitor Deployment

1. Watch GitHub Actions logs
2. Deployment takes ~10-15 minutes for first-time setup
3. Monitor progress in the Actions tab

## ✅ Step 4: Verify Deployment

After deployment completes, verify:

```bash
# SSH to server
ssh -i "eazyvenue-key-new.pem" ubuntu@13.61.182.152

# Check services
sudo systemctl status nginx
sudo systemctl status redis-server
sudo systemctl status mongod
pm2 status

# Test API
curl -k https://api.eazyvenue.in/api/health
```

## 🛠️ What Gets Deployed

The deployment process will:

1. ✅ **Install Node.js 18** (if not present)
2. ✅ **Install & Configure Redis** (for caching & sessions)
3. ✅ **Install & Configure MongoDB** (local database)
4. ✅ **Install & Configure Nginx** (reverse proxy)
5. ✅ **Setup SSL Certificate** (Let's Encrypt for api.eazyvenue.in)
6. ✅ **Install PM2** (process manager)
7. ✅ **Deploy Application** with clustering
8. ✅ **Configure Security** (firewall, headers, rate limiting)

## 📁 Directory Structure on Server

```
/var/www/eazyvenue-backend/     # Application files
├── src/                        # Source code
├── logs/                       # PM2 logs
├── ecosystem.config.js         # PM2 configuration
├── .env                        # Environment variables
└── node_modules/              # Dependencies

/etc/nginx/sites-available/     # Nginx configuration
/etc/letsencrypt/              # SSL certificates
/var/log/nginx/                # Nginx logs
```

## 🔍 Health Checks

The API provides health check endpoints:

- **Health**: `https://api.eazyvenue.in/api/health`
- **Status**: Returns service status, database connectivity, Redis status

Expected Response:
```json
{
  "uptime": 120.5,
  "message": "OK",
  "service": "eazyvenue-backend",
  "environment": "production",
  "database": "connected",
  "redis": {"status": "connected", "isReady": true}
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **SSL Certificate Failed**:
   ```bash
   sudo systemctl stop nginx
   sudo certbot certonly --standalone -d api.eazyvenue.in
   sudo systemctl start nginx
   ```

2. **PM2 App Not Starting**:
   ```bash
   cd /var/www/eazyvenue-backend
   pm2 logs eazyvenue-backend
   pm2 restart eazyvenue-backend
   ```

3. **Database Connection Issues**:
   ```bash
   sudo systemctl restart mongod
   mongosh --eval "db.adminCommand('ismaster')"
   ```

4. **Redis Issues**:
   ```bash
   sudo systemctl restart redis-server
   redis-cli ping
   ```

### Useful Commands:

```bash
# PM2 Management
pm2 status                    # Check status
pm2 logs eazyvenue-backend   # View logs
pm2 restart eazyvenue-backend # Restart app
pm2 monit                    # Monitor resources

# Service Management  
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status mongod
sudo systemctl status redis-server

# Log Monitoring
tail -f /var/log/nginx/eazyvenue-backend.error.log
tail -f /var/www/eazyvenue-backend/logs/error.log
```

## 🔄 Re-deployment

For subsequent deployments:
1. Just push to main branch
2. GitHub Actions will handle the update
3. Zero-downtime deployment using PM2 reload

## 📈 Performance

- **PM2 Cluster Mode**: Uses all CPU cores
- **Nginx Caching**: Static files cached for 1 year
- **Redis Caching**: Session and API response caching
- **Gzip Compression**: Enabled for all text content
- **HTTP/2**: Enabled for better performance

## 🔒 Security

- **HTTPS Only**: All traffic redirected to HTTPS
- **Security Headers**: XSS, CSRF, Content-Type protection
- **Rate Limiting**: 100 requests/minute per IP
- **Firewall**: UFW configured (SSH, HTTP, HTTPS only)
- **File Upload Limits**: 50MB max

## 🎯 Next Steps

Once backend deployment is successful:
1. Test all API endpoints
2. Verify database connectivity
3. Check file upload functionality
4. Monitor logs for any errors
5. Proceed with frontend deployment

---

**Ready to deploy?** Make sure all secrets are configured and push your code! 🚀
