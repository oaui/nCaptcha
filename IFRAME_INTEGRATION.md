# 🖼️ nCaptcha iFrame Integration Guide

Complete guide for integrating the refactored server-side captcha using iframes.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   netforensics.dev (Demo Site)          │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  <iframe>                       │   │
│   │    src="challenges.netforensics │   │
│   │         .dev"                   │   │
│   │                                 │   │
│   │    [Captcha Widget]             │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│              │                          │
│              │ postMessage              │
│              ▼                          │
│   window.addEventListener('message')   │
│                                         │
└─────────────────────────────────────────┘
                 │
                 │ Token Verification
                 ▼
┌─────────────────────────────────────────┐
│   Backend API                           │
│   POST /api/verify-captcha              │
│   → Validates token with captcha server │
└─────────────────────────────────────────┘
```

## Part 1: Update Demo Site HTML

Your demo site already has the basic structure. Update it to handle the new token format:

### Updated Integration Code

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>nCaptcha Demo</title>
    <style>
      /* Your existing styles */
      .captcha-status {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
      }
      .status-pending {
        background: rgba(251, 140, 0, 0.1);
        color: #ffa726;
        border: 1px solid rgba(251, 140, 0, 0.3);
      }
      .status-success {
        background: rgba(76, 175, 80, 0.1);
        color: #66bb6a;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }
      .status-error {
        background: rgba(229, 57, 53, 0.1);
        color: #ef5350;
        border: 1px solid rgba(229, 57, 53, 0.3);
      }
    </style>
  </head>
  <body>
    <!-- Your existing content -->

    <div class="demo-container">
      <iframe
        id="captcha-frame"
        src="https://challenges.netforensics.dev"
        style="width: 380px; height: 100px; border: none; border-radius: 8px;"
        frameborder="0"
        scrolling="no"
        sandbox="allow-same-origin allow-scripts"
      ></iframe>

      <div id="captcha-status" class="captcha-status status-pending" style="display: none;">
        Waiting for verification...
      </div>
    </div>

    <script>
      let captchaToken = null;
      let isVerified = false;

      // Listen for captcha events
      window.addEventListener('message', async (event) => {
        // Security: Verify origin
        if (event.origin !== 'https://challenges.netforensics.dev') {
          console.warn('Received message from unauthorized origin:', event.origin);
          return;
        }

        // Handle captcha solved event
        if (event.data?.type === 'ncaptcha-solved') {
          captchaToken = event.data.token;

          // Update UI
          const statusEl = document.getElementById('captcha-status');
          statusEl.style.display = 'block';
          statusEl.className = 'captcha-status status-success';
          statusEl.textContent = '✓ Human verified!';

          console.log('Captcha solved! Token:', captchaToken);

          // Verify token with your backend
          await verifyWithBackend(captchaToken);
        }
      });

      // Verify token with your backend API
      async function verifyWithBackend(token) {
        try {
          const response = await fetch('https://netforensics.dev/api/verify-captcha', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ captchaToken: token })
          });

          const result = await response.json();

          if (result.valid) {
            isVerified = true;
            console.log('Backend verification successful');
            // Enable form submission, etc.
          } else {
            console.error('Backend verification failed');
            showError('Verification failed. Please try again.');
          }
        } catch (error) {
          console.error('Backend verification error:', error);
          showError('Network error. Please try again.');
        }
      }

      // Example: Use in form submission
      document.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isVerified) {
          showError('Please complete the captcha first');
          return;
        }

        // Include token in form submission
        const formData = new FormData(e.target);
        formData.append('captchaToken', captchaToken);

        // Submit form...
      });

      function showError(message) {
        const statusEl = document.getElementById('captcha-status');
        statusEl.style.display = 'block';
        statusEl.className = 'captcha-status status-error';
        statusEl.textContent = message;
      }
    </script>
  </body>
</html>
```

## Part 2: Update Server CORS Configuration

Update your server to allow requests from your production domains:

### `server/.env` (Production)

```env
# Production configuration
NPOW_SECRET=your-secure-production-secret-here
PORT=8910

# Allow requests from your domains
ALLOWED_ORIGINS=https://netforensics.dev,https://www.netforensics.dev,https://challenges.netforensics.dev

# Enable strict validation in production
STRICT_VALIDATION=true

NODE_ENV=production
```

### Server CORS Headers (Already configured ✅)

The refactored `ValidationServer.js` already handles CORS properly. Just make sure `.env` is configured correctly.

## Part 3: Captcha Widget iFrame Page

Create a dedicated page for the iframe:

### `client/iframe.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>nCaptcha Widget</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <script type="module" src="js/CaptchaWidget.js"></script>
  </body>
</html>
```

**Then update your iframe src:**
```html
<iframe src="https://challenges.netforensics.dev/iframe.html" ...></iframe>
```

## Part 4: Backend Token Verification

Add an endpoint to your backend to verify tokens:

### Node.js / Express Example

```javascript
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Verify captcha token
app.post('/api/verify-captcha', async (req, res) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({
      valid: false,
      error: 'Missing captcha token'
    });
  }

  try {
    // Verify with captcha server
    const response = await fetch('https://challenges.netforensics.dev:8910/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.headers['user-agent']
      },
      body: JSON.stringify({
        token: captchaToken
      })
    });

    const data = await response.json();

    if (data.valid) {
      // Token is valid - proceed with user request
      return res.json({
        valid: true,
        message: 'Captcha verified successfully'
      });
    } else {
      // Token is invalid
      return res.status(400).json({
        valid: false,
        error: 'Invalid captcha token'
      });
    }
  } catch (error) {
    console.error('Captcha verification error:', error);
    return res.status(500).json({
      valid: false,
      error: 'Verification service unavailable'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Python / Flask Example

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/api/verify-captcha', methods=['POST'])
def verify_captcha():
    data = request.json
    captcha_token = data.get('captchaToken')

    if not captcha_token:
        return jsonify({'valid': False, 'error': 'Missing captcha token'}), 400

    try:
        # Verify with captcha server
        response = requests.post(
            'https://challenges.netforensics.dev:8910/api/verify',
            json={'token': captcha_token},
            headers={'User-Agent': request.headers.get('User-Agent')}
        )

        result = response.json()

        if result.get('valid'):
            return jsonify({'valid': True, 'message': 'Captcha verified'})
        else:
            return jsonify({'valid': False, 'error': 'Invalid token'}), 400

    except Exception as e:
        print(f'Verification error: {e}')
        return jsonify({'valid': False, 'error': 'Service unavailable'}), 500

if __name__ == '__main__':
    app.run(port=3000)
```

## Part 5: Deployment Checklist

### On `challenges.netforensics.dev`:

1. **Deploy captcha client files:**
   ```bash
   # Upload client/ folder contents to web root
   /var/www/challenges.netforensics.dev/
   ├── iframe.html        # Main entry point
   ├── index.html         # Optional: standalone page
   ├── js/
   │   ├── CaptchaWidget.js
   │   ├── Validation.js
   │   ├── API.js
   │   └── util/
   └── img/
   ```

2. **Deploy validation server:**
   ```bash
   cd server

   # Install dependencies
   npm install --production

   # Set up .env
   cp .env.example .env
   # Edit with production values

   # Start with PM2 or systemd
   pm2 start ValidationServer.js --name ncaptcha-server
   ```

3. **Configure web server (Nginx):**
   ```nginx
   # Serve static files
   server {
       listen 443 ssl http2;
       server_name challenges.netforensics.dev;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       root /var/www/challenges.netforensics.dev;
       index iframe.html;

       # Serve static files
       location / {
           try_files $uri $uri/ =404;
       }

       # Proxy API to Node.js server
       location /api/ {
           proxy_pass http://localhost:8910;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Firewall rules:**
   ```bash
   # Allow only from your demo site
   ufw allow from netforensics.dev to any port 8910
   ```

### On `netforensics.dev`:

1. **Update demo site HTML** (as shown in Part 1)
2. **Add backend verification** (as shown in Part 4)
3. **Test iframe loads correctly**

## Part 6: Testing

### Local Testing

```bash
# 1. Start captcha server
cd server
npm start

# 2. Serve client (simulating challenges subdomain)
cd ../client
python3 -m http.server 8080

# 3. Serve demo site (simulating main domain)
cd "../nCaptcha Doc Site/public"
python3 -m http.server 3000

# 4. Test:
# - Open http://localhost:3000
# - Complete captcha in iframe
# - Check console for token
# - Verify backend receives token
```

### Production Testing

```bash
# Test captcha server
curl https://challenges.netforensics.dev:8910/api/health

# Test iframe loads
curl https://challenges.netforensics.dev/iframe.html

# Test demo site
curl https://netforensics.dev
```

## Security Considerations

### 1. Origin Validation
Always verify `event.origin` in postMessage listener:
```javascript
if (event.origin !== 'https://challenges.netforensics.dev') {
  return; // Reject
}
```

### 2. Token Verification
**NEVER trust the token from the client alone!** Always verify server-side:
```javascript
// ❌ WRONG - Client can fake this
if (token) {
  allowAccess();
}

// ✅ CORRECT - Verify with backend
const isValid = await verifyWithBackend(token);
if (isValid) {
  allowAccess();
}
```

### 3. HTTPS Only
Both domains MUST use HTTPS in production:
- `https://netforensics.dev`
- `https://challenges.netforensics.dev`

### 4. CSP Headers
Add Content-Security-Policy:
```nginx
add_header Content-Security-Policy "frame-ancestors https://netforensics.dev https://www.netforensics.dev;" always;
```

## Troubleshooting

### iframe not loading
- Check CORS: `ALLOWED_ORIGINS` in `.env`
- Check CSP: `frame-ancestors` header
- Verify HTTPS certificates

### postMessage not received
- Verify `event.origin` check
- Check browser console for errors
- Ensure iframe has loaded (use `iframe.onload`)

### Token verification fails
- Check server logs on `challenges.netforensics.dev:8910`
- Verify token hasn't expired (5 min limit)
- Check IP/User-Agent if `STRICT_VALIDATION=true`

## Advanced: Multiple iframes

If you need multiple captchas on one page:

```html
<iframe id="captcha-1" src="https://challenges.netforensics.dev/iframe.html"></iframe>
<iframe id="captcha-2" src="https://challenges.netforensics.dev/iframe.html"></iframe>

<script>
const tokens = {};

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://challenges.netforensics.dev') return;

  if (event.data?.type === 'ncaptcha-solved') {
    // Store token with unique ID
    const frameId = event.data.frameId || 'default';
    tokens[frameId] = event.data.token;
  }
});
</script>
```

---

## Summary

1. ✅ **Demo site** embeds iframe from `challenges.netforensics.dev`
2. ✅ **User solves captcha** → postMessage sends token
3. ✅ **Demo site** receives token via event listener
4. ✅ **Backend verifies** token with captcha server
5. ✅ **If valid** → Allow user action

This creates a secure, server-side validated captcha system with clean separation of concerns! 🎉
