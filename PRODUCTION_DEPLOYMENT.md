# 🚀 Production Deployment Checklist

Deploy nCaptcha to `challenges.netforensics.dev` and integrate with `netforensics.dev`

## Architecture

```
┌────────────────────────────────────────────┐
│  netforensics.dev (Demo Site)              │
│                                            │
│  <iframe src="challenges.netforensics     │
│              .dev/iframe.html">            │
│                                            │
│    ┌────────────────────────────────┐     │
│    │  Captcha Widget                │     │
│    │  (from challenges subdomain)   │     │
│    └────────────────────────────────┘     │
│                                            │
│  Origin Check: challenges.netforensics.dev │
└────────────────────────────────────────────┘
                    │
                    │ postMessage
                    ▼
        window.addEventListener('message')
                    │
                    │ Token: eyJhbG...
                    ▼
        Backend Verification Required
```

## Part 1: Deploy Captcha Server (challenges.netforensics.dev)

### 1.1 Server Setup

```bash
# On your server
cd /var/www/challenges.netforensics.dev

# Clone or upload files
git clone <your-repo> .
# OR upload via FTP/SFTP

# Install dependencies
cd server
npm install --production
```

### 1.2 Configure Environment

```bash
cd server
nano .env
```

**Production `.env`:**
```env
# Production Secret (generate new one!)
NPOW_SECRET=<generate-with-openssl-rand-base64-32>

# Server port
PORT=8910

# CORS - Allow your demo site
ALLOWED_ORIGINS=https://netforensics.dev,https://www.netforensics.dev

# Strict validation
STRICT_VALIDATION=true

# Production mode
NODE_ENV=production
```

**Generate secret:**
```bash
openssl rand -base64 32
```

### 1.3 Start Server with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start ValidationServer.js --name ncaptcha-server

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instructions it prints
```

### 1.4 Verify Server Running

```bash
# Check status
pm2 status

# Check logs
pm2 logs ncaptcha-server

# Test endpoint
curl http://localhost:8910/api/health
```

Should return:
```json
{
  "success": true,
  "message": "nCaptcha server is running",
  "cors": "enabled",
  "timestamp": 1234567890
}
```

## Part 2: Deploy Client Widget

### 2.1 Upload Client Files

```bash
# Copy client files to web root
/var/www/challenges.netforensics.dev/
├── iframe.html          # Main entry point ✓
├── index.html           # Optional standalone page
├── js/
│   ├── CaptchaWidget.js
│   ├── Validation.js
│   ├── API.js
│   └── util/
│       ├── Cookie.js
│       ├── DataCapture.js
│       └── Util.js
└── img/
    ├── logo.png
    └── logo_lock.png
```

### 2.2 Update Client API URL

Edit `client/js/API.js` line 6-9:

```javascript
const API_BASE_URL =
  window.location.hostname.includes("github.dev")
    ? `https://${window.location.hostname.replace(/-\d+/, "-8910")}`
    : "https://challenges.netforensics.dev:8910";  // Update this!
```

Or for clean URLs (if using nginx proxy):
```javascript
const API_BASE_URL = "https://challenges.netforensics.dev";
```

## Part 3: Nginx Configuration

### 3.1 Main Config

```nginx
# /etc/nginx/sites-available/challenges.netforensics.dev

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name challenges.netforensics.dev;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/challenges.netforensics.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/challenges.netforensics.dev/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "ALLOW-FROM https://netforensics.dev" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "frame-ancestors https://netforensics.dev https://www.netforensics.dev" always;

    # Root directory
    root /var/www/challenges.netforensics.dev;
    index iframe.html index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ =404;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API to Node.js server
    location /api/ {
        proxy_pass http://localhost:8910;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name challenges.netforensics.dev;
    return 301 https://$server_name$request_uri;
}
```

### 3.2 Enable & Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/challenges.netforensics.dev /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Part 4: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d challenges.netforensics.dev

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

## Part 5: Update Demo Site (netforensics.dev)

### 5.1 Update HTML

Your demo site HTML is already configured! Both files now use:
- ✅ `https://challenges.netforensics.dev/iframe.html` as source
- ✅ Origin check: `event.origin !== 'https://challenges.netforensics.dev'`

Files ready:
- ✅ `nCaptcha Doc Site/public/index.html` (updated)
- ✅ `nCaptcha Doc Site/public/index-updated.html` (ready)

### 5.2 Deploy Demo Site

```bash
# Upload to netforensics.dev
# Copy files from "nCaptcha Doc Site/public/" to your web root
```

## Part 6: Backend Verification (Optional but Recommended)

Add an endpoint to verify tokens server-side:

```javascript
// Your backend (netforensics.dev)
app.post('/api/verify-captcha', async (req, res) => {
  const { captchaToken } = req.body;

  const response = await fetch('https://challenges.netforensics.dev/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: captchaToken })
  });

  const result = await response.json();
  res.json({ valid: result.valid });
});
```

## Part 7: Testing

### 7.1 Test Captcha Server

```bash
# Health check
curl https://challenges.netforensics.dev/api/health

# Challenge endpoint
curl https://challenges.netforensics.dev/api/challenge
```

### 7.2 Test Widget

Open: `https://challenges.netforensics.dev/iframe.html`
- Should see captcha widget
- Test slider mode
- Test invisible mode

### 7.3 Test Demo Site

Open: `https://netforensics.dev`
- Scroll to demo section
- iframe should load captcha
- Complete captcha
- Check browser console for token
- Should see: "Human verified using iFrame returned token"

### 7.4 Test Integration

```javascript
// In browser console on netforensics.dev
window.addEventListener('message', (e) => {
  console.log('Origin:', e.origin);
  console.log('Data:', e.data);
});
```

Complete captcha and verify:
- ✅ Origin: `https://challenges.netforensics.dev`
- ✅ Data: `{ type: 'ncaptcha-solved', token: '...' }`

## Part 8: Monitoring

### 8.1 Server Monitoring

```bash
# PM2 monitoring
pm2 monit

# Server logs
pm2 logs ncaptcha-server --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 8.2 Setup Alerts

```bash
# Email alerts on server restart
pm2 install pm2-auto-pull
```

## Part 9: Security Hardening

### 9.1 Firewall

```bash
# Only allow nginx and SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Server port should NOT be exposed
# Nginx proxies to localhost:8910
```

### 9.2 Rate Limiting (Nginx)

Add to nginx config:
```nginx
# Limit requests to API
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

### 9.3 Fail2ban

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure nginx filter
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
```

## Troubleshooting

### iframe doesn't load
- Check: Browser console for errors
- Verify: SSL certificate valid
- Test: `curl https://challenges.netforensics.dev/iframe.html`
- Check: CSP headers allow embedding

### postMessage not received
- Verify: Origin check matches `https://challenges.netforensics.dev`
- Check: Browser console for blocked messages
- Test: `event.origin` in console

### CORS errors
- Check: Server `.env` has correct `ALLOWED_ORIGINS`
- Verify: Server restarted after changing `.env`
- Test: `curl -H "Origin: https://netforensics.dev" https://challenges.netforensics.dev/api/health`

### API requests fail
- Check: Nginx proxy configuration
- Verify: PM2 server is running
- Test: `curl http://localhost:8910/api/health` on server
- Check: Firewall not blocking localhost

## Rollback Plan

If issues occur:

1. **Disable captcha temporarily:**
   ```javascript
   // In demo site
   const CAPTCHA_ENABLED = false;
   ```

2. **Check server logs:**
   ```bash
   pm2 logs ncaptcha-server
   ```

3. **Restart services:**
   ```bash
   pm2 restart ncaptcha-server
   sudo systemctl reload nginx
   ```

## Success Criteria

- ✅ `https://challenges.netforensics.dev/iframe.html` loads
- ✅ `https://challenges.netforensics.dev/api/health` returns JSON
- ✅ `https://netforensics.dev` embeds captcha
- ✅ Completing captcha sends postMessage
- ✅ Token can be verified with `/api/verify`
- ✅ No CORS errors in browser console
- ✅ SSL certificates valid
- ✅ Server stays running (PM2)

---

## Quick Command Reference

```bash
# Server management
pm2 status
pm2 logs ncaptcha-server
pm2 restart ncaptcha-server
pm2 stop ncaptcha-server

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx

# SSL renewal
sudo certbot renew --dry-run

# View logs
sudo tail -f /var/log/nginx/access.log
pm2 logs ncaptcha-server --lines 100
```

---

**Ready to deploy?** Follow the parts in order and you'll have a production-ready captcha system! 🚀
