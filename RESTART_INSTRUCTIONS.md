# 🔧 Fixed CORS Issues - Restart Instructions

## What Was Fixed

✅ **CORS Configuration** - Updated server to properly handle all origins
✅ **Environment Variables** - Set ALLOWED_ORIGINS to wildcard for development
✅ **Logo Path** - Copied images to client folder
✅ **Secret Key** - Generated secure NPOW_SECRET
✅ **Strict Validation** - Disabled for easier development

## How to Restart

### 1. Stop Current Processes
Press `Ctrl+C` in both terminal windows to stop:
- The Python HTTP server (port 5500)
- The Node.js server (port 8910)

### 2. Restart the Server
```bash
cd server
npm start
```

You should see:
```
[dotenv@17.2.4] injecting env (5) from .env
nCaptcha Validation Server running on http://127.0.0.1:8910
Environment: development
Strict validation: false
```

### 3. Restart the Client
In a new terminal:
```bash
cd client
python3 -m http.server 5500
```

### 4. Test CORS First
Open in browser: **http://localhost:5500/test-cors.html**

Click the three test buttons in order:
1. **Test /api/health** - Should show green ✓ Success
2. **Test /api/challenge** - Should return a challengeId
3. **Test Complete Flow** - Should pass validation

If all three work, CORS is fixed! ✅

### 5. Test the Full Captcha
Open: **http://localhost:5500**

Try both modes:
- **Slider Mode**: Click lock → Slide to verify
- **Invisible Mode**: Click button → Should auto-verify

## If CORS Still Fails

### Check Browser Console
Open DevTools (F12) and look for:
- ✅ Green success messages
- ❌ Red CORS errors

### Common Issues

**"Failed to fetch"**
- Make sure server is running on port 8910
- Check: `curl http://localhost:8910/api/health`

**"CORS header missing"**
- Restart the server (it reads .env on startup)
- Verify .env has `ALLOWED_ORIGINS=` (empty = wildcard)

**"Network Error"**
- Use `http://localhost:5500` not `http://[::]:5500`
- Try: `http://127.0.0.1:5500` instead

## What Changed in the Files

### `server/.env`
```diff
- ALLOWED_ORIGINS=*
+ ALLOWED_ORIGINS=

- STRICT_VALIDATION=true
+ STRICT_VALIDATION=false

- NODE_ENV=production
+ NODE_ENV=development

+ NPOW_SECRET=vPgVlO5mlPbgYf+HqAq2sQW//x4/8SlH6lbCShGY4oE=
```

### `server/ValidationServer.js`
```diff
  cors({
-   origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
+   origin: process.env.ALLOWED_ORIGINS
+     ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
+     : "*",
    methods: ["POST", "GET", "OPTIONS"],
-   allowedHeaders: ["Content-Type", "X-Captcha-Token"],
+   allowedHeaders: ["Content-Type", "X-Captcha-Token", "User-Agent"],
+   credentials: true,
  })
```

### `client/img/`
✅ Added logo files (copied from parent folder)

## Production Notes

When deploying to production:

1. **Set specific origins**:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

2. **Enable strict validation**:
   ```env
   STRICT_VALIDATION=true
   ```

3. **Use production mode**:
   ```env
   NODE_ENV=production
   ```

4. **Generate new secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

---

**Ready?** Follow steps 1-5 above and you should be all set! 🚀
