# 🧪 Test iFrame Integration Locally

Quick guide to test the iframe integration before deploying to production.

## Quick Test (3 terminals)

### Terminal 1: Start Captcha Server
```bash
cd server
npm start
```
Should show:
```
nCaptcha Validation Server running on http://127.0.0.1:8910
```

### Terminal 2: Serve Captcha Widget (iframe content)
```bash
cd client
python3 -m http.server 5500
# Or: live-server --port=5500
```

### Terminal 3: Serve Demo Site
```bash
cd "nCaptcha Doc Site/public"
python3 -m http.server 3000
# Or: live-server --port=3000
```

## Test It!

1. **Open demo site**: http://localhost:3000/index-updated.html
2. **Complete captcha** in the iframe
3. **Check browser console** (F12) for:
   ```
   ✓ Captcha solved! Token received: eyJhbG...
   ```
4. **Look for green status** message: "✓ Human verified!"

## What You'll See

```
Demo Site (localhost:3000)
├── Header
├── Hero
└── Demo Section
    └── [iframe: localhost:5500/iframe.html]
        └── Captcha Widget
            ├── Slider Mode
            └── Invisible Mode
```

When you complete the captcha:
```
1. Widget → postMessage('ncaptcha-solved')
2. Demo Site → Receives message
3. Console → Logs token
4. Status → Shows "✓ Human verified!"
```

## Troubleshooting

### iframe shows blank
- Check: Is http://localhost:5500/iframe.html accessible?
- Try: Open it directly in browser

### No postMessage received
- Check: Browser console for origin errors
- Verify: `allowedOrigins` includes `http://localhost:5500`
- Check: Demo site is on localhost:3000 (not 127.0.0.1)

### CORS errors
- Check: Server is running on port 8910
- Verify: Client can reach http://localhost:8910/api/health

## Production Differences

When deploying to production, change:

**Demo Site (index-updated.html)**:
```javascript
// Development
const captchaUrl = 'http://localhost:5500/iframe.html';
const allowedOrigins = ['http://localhost:5500'];

// Production
const captchaUrl = 'https://challenges.netforensics.dev/iframe.html';
const allowedOrigins = ['https://challenges.netforensics.dev'];
```

**Server (.env)**:
```env
# Development
ALLOWED_ORIGINS=
NODE_ENV=development

# Production
ALLOWED_ORIGINS=https://netforensics.dev,https://challenges.netforensics.dev
NODE_ENV=production
```

## Next Steps

Once local testing works:
1. ✅ Replace `public/index.html` with `public/index-updated.html`
2. ✅ Follow [IFRAME_INTEGRATION.md](IFRAME_INTEGRATION.md) for production deployment
3. ✅ Update server `.env` with production URLs
4. ✅ Deploy to your subdomains

---

**Working locally? Ready for production!** 🚀
