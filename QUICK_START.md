# nCaptcha Server-Side - Quick Start

Get up and running in 5 minutes!

## Step 1: Setup Environment (1 minute)

```bash
# Generate a secure secret key
openssl rand -base64 32
# Output: e.g., "X7YzP9qR3mK5nL8tW2vB6cD1fG4hJ0sA=="

# Create .env file
cp .env.example .env

# Edit .env and add your secret
echo "NPOW_SECRET=X7YzP9qR3mK5nL8tW2vB6cD1fG4hJ0sA==" >> .env
```

## Step 2: Install Dependencies (1 minute)

```bash
cd server
npm install
```

## Step 3: Start the Server (30 seconds)

```bash
npm start
```

You should see:
```
nCaptcha Validation Server running on http://127.0.0.1:8910
Environment: production
Strict validation: true
```

## Step 4: Serve the Client (30 seconds)

Open a new terminal:

```bash
# Option 1: Python
cd client
python3 -m http.server 5500

# Option 2: Node.js http-server
npm install -g http-server
cd client
http-server -p 5500

# Option 3: VS Code
# Right-click client/index.html > Open with Live Server
```

## Step 5: Test It! (1 minute)

1. Open browser: `http://127.0.0.1:5500`
2. You should see the captcha widget
3. Try both modes:
   - **Slider mode**: Click lock → Slide to verify
   - **Invisible mode**: Click button → Auto-verify

### Test Success
✅ You'll see a green checkmark and "Verified successfully"

### Check Server Logs
You'll see detection results in the terminal:
```
{ automatedBrowser: false, type: '', reason: '' }
```

## Next Steps

### Integrate with Your Backend

Add token verification to your form handler:

```javascript
// Your backend endpoint
app.post('/api/submit-form', async (req, res) => {
  const { captchaToken } = req.body;

  // Verify with nCaptcha server
  const response = await fetch('http://localhost:8910/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: captchaToken })
  });

  const data = await response.json();
  if (!data.valid) {
    return res.status(400).json({ error: 'Invalid captcha' });
  }

  // Process your form...
});
```

### Customize

Edit `client/js/API.js` to change the server URL:
```javascript
const API_BASE_URL = "https://your-domain.com";
```

## Common Issues

### "Connection refused"
- Make sure server is running on port 8910
- Check if another process is using the port: `lsof -i :8910`

### "CORS error"
- Update `ALLOWED_ORIGINS` in `.env`
- Add your client URL: `ALLOWED_ORIGINS=http://localhost:5500`

### "Invalid or expired challenge"
- Refresh the page to get a new challenge
- Challenges expire after 5 minutes

## Architecture Summary

```
Client (Browser)          Server (Node.js)
┌──────────────┐         ┌────────────────────┐
│              │         │                    │
│  Capture:    │──POST───▶  Validate:        │
│  • Mouse     │ /api/   │  • Detection      │
│  • Browser   │ validate│  • Heuristics     │
│  • Events    │         │  • Integrity      │
│              │         │                    │
│              │◀──JSON──│  Return Token     │
│  Show UI     │         │                    │
└──────────────┘         └────────────────────┘
```

**Key Point**: All detection runs on the server. Client only captures data and displays UI.

## What's Different?

| Old (Client-Side) | New (Server-Side) |
|------------------|-------------------|
| Detection in browser | Detection on server ✅ |
| Easy to bypass | Secure ✅ |
| 1 endpoint | 3 endpoints ✅ |
| No rate limiting | Built-in protection ✅ |

## Read More

- **Full Guide**: See `REFACTORING_GUIDE.md` for detailed documentation
- **API Reference**: All endpoints explained with examples
- **Production Setup**: Deployment with Redis and load balancing

---

**That's it!** You now have a working server-side captcha system. 🎉
