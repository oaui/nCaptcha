# nCaptcha Server-Side Refactoring Guide

## Overview

This refactoring transforms nCaptcha from a client-side detection system into a **secure server-side implementation** similar to Cloudflare Turnstile. All bot detection logic now runs on the server, making it impossible for attackers to bypass or reverse-engineer the detection mechanisms.

## Architecture Changes

### Before (Client-Side)
```
┌─────────────────────────────────────┐
│          Browser (Client)           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  UI + Detection Logic       │   │
│  │  - Heuristics               │   │
│  │  - Integrity checks         │   │
│  │  - Interaction analysis     │   │
│  │  - Browser detection        │   │
│  └─────────────────────────────┘   │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐   │
│  │   Send result to server     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│           Server                    │
│  - Only token generation            │
│  - No validation logic              │
└─────────────────────────────────────┘
```

### After (Server-Side) ✅
```
┌─────────────────────────────────────┐
│          Browser (Client)           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  UI Only                    │   │
│  │  - Slider/Invisible widget  │   │
│  │  - Interaction capture      │   │
│  │  - Browser fingerprint      │   │
│  └─────────────────────────────┘   │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐   │
│  │   Send captured data        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│           Server                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ALL Detection Logic        │   │
│  │  - Heuristics ✓             │   │
│  │  - Integrity checks ✓       │   │
│  │  - Interaction analysis ✓   │   │
│  │  - Browser detection ✓      │   │
│  │  - Token generation ✓       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Key Benefits

### 🔒 Security
- **No client-side detection**: Attackers cannot study detection algorithms
- **Server-side validation**: All checks happen in a secure environment
- **Token-based authentication**: HMAC-SHA256 signed tokens prevent forgery
- **Rate limiting**: Built-in protection against brute force attempts
- **IP & User-Agent verification**: Optional strict validation

### 🛡️ Detection Integrity
- **All detection logic preserved**: NO changes to detection algorithms
- **Same method names**: Easy migration, familiar codebase
- **Chromium detection**: Playwright, Puppeteer, Selenium (unchanged)
- **Interaction analysis**: Mouse movement, click patterns (unchanged)
- **Heuristics**: Language checks, webdriver detection (unchanged)
- **Integrity checks**: Function patching, automation markers (unchanged)

### 🚀 Scalability
- **Stateless architecture**: Scales horizontally with load balancers
- **Token storage**: Easily swap in-memory Map with Redis/Memcached
- **CDN-friendly**: Client widget can be served from CDN
- **API-first**: RESTful endpoints for easy integration

## File Structure

```
nCaptcha/
├── client/                          # NEW: Client-side widget
│   ├── index.html
│   └── js/
│       ├── CaptchaWidget.js        # UI and interaction capture
│       ├── Validation.js           # Orchestrates validation flow
│       ├── API.js                  # Server communication
│       └── util/
│           ├── DataCapture.js      # Browser fingerprint collection
│           ├── Cookie.js           # Cookie management
│           └── Util.js             # Utilities
│
├── server/                          # NEW: Server-side validation
│   ├── ValidationServer.js         # Main Express server
│   ├── package.json
│   ├── detection/                  # Detection logic (preserved)
│   │   ├── Detection.js           # Main detection orchestrator
│   │   ├── Heuristics.js          # Language checks, etc.
│   │   ├── Integrity.js           # Webdriver, function patching
│   │   ├── Interaction.js         # Mouse/pointer analysis
│   │   ├── browsers/
│   │   │   └── Chromium.js        # Playwright, Puppeteer, Selenium
│   │   └── util/
│   │       └── Helpers.js         # Detection utilities
│   ├── obj/                        # Data structures
│   │   ├── Config.js
│   │   └── RequestData.js
│   └── util/
│       └── Util.js
│
├── .env.example                     # Configuration template
└── REFACTORING_GUIDE.md            # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Server dependencies
cd server
npm install

# Or use the root package.json (if you keep it)
cd ..
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Generate a secure secret key
openssl rand -base64 32

# Edit .env and set your NPOW_SECRET
nano .env
```

Example `.env`:
```env
NPOW_SECRET=your-generated-secret-key-here
PORT=8910
ALLOWED_ORIGINS=*
STRICT_VALIDATION=true
NODE_ENV=production
```

### 3. Start the Server

```bash
# Production mode
cd server
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start on `http://127.0.0.1:8910`

### 4. Serve the Client

Use any static file server:

```bash
# Using Python
cd client
python3 -m http.server 5500

# Using Node.js (http-server)
npm install -g http-server
cd client
http-server -p 5500

# Using VS Code Live Server
# Right-click index.html > Open with Live Server
```

The client will be available at `http://127.0.0.1:5500`

## API Endpoints

### 1. GET `/api/challenge`
Initialize a new captcha challenge.

**Response:**
```json
{
  "success": true,
  "challengeId": "a1b2c3d4e5f6...",
  "expiresInMinutes": 5
}
```

### 2. POST `/api/validate`
Submit captcha for validation. Server performs all detection.

**Request:**
```json
{
  "challengeId": "a1b2c3d4e5f6...",
  "requestData": {
    "userAgent": "Mozilla/5.0...",
    "vendor": "Google Inc.",
    "window": { /* browser fingerprint */ }
  },
  "interactionData": {
    "mouseMovements": [...],
    "pointerEvents": [...],
    "pointerClickDurations": [...],
    "clicks": [...]
  },
  "mode": {
    "slider": true,
    "invisible": false,
    "click": false
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "validationSuccess": true,
  "token": "eyJhbG...",
  "expiresInMinutes": 5
}
```

**Response (Bot Detected):**
```json
{
  "success": false,
  "validationSuccess": false,
  "reason": "Selenium: Selenium Chrome Driver detected via ret_nodes"
}
```

### 3. POST `/api/verify`
Verify an existing token (for your backend).

**Request:**
```json
{
  "token": "eyJhbG..."
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "mode": "slider",
  "issuedAt": 1234567890,
  "expiresAt": 1234567890
}
```

## Detection Logic - 100% Preserved

All detection logic has been moved to the server **without any modifications**:

### ✅ Method Names Preserved
- `start()` - Main detection entry point
- `handlePlaywright()` - Playwright detection
- `handlePuppeteer()` - Puppeteer detection
- `handleSelenium()` - Selenium detection
- `handleAutomation()` - General automation checks
- `analyzeHeuristics()` - Language and browser heuristics
- `analyzeIntegrity()` - Webdriver and function integrity
- `analyzeInteraction()` - Mouse and pointer analysis
- `inspectMouseMovment()` - Movement curve analysis
- `inspectPointerClicks()` - Click duration analysis
- `detectBrowser()` - Browser type detection
- `isNativeAccessor()` - Puppeteer detection helper

### ✅ Detection Algorithms Preserved
- **Playwright Detection**: `InterestEvent`, `SpeechRecognitionPhrase`, Brave wallet checks
- **Puppeteer Detection**: Native screen accessor validation
- **Selenium Detection**: `ret_nodes`, `cdc_` markers
- **Webdriver Detection**: `navigator.webdriver` flag
- **Integrity Checks**: MouseEvent descriptors, Function.prototype.toString
- **Interaction Analysis**:
  - Chunk-based Y-movement averaging (CHUNK_SIZE = 20)
  - Flat ratio threshold: 0.4
  - Tiny movement ratio threshold: 0.6
  - Click duration minimum: 1ms
- **Language Checks**: Language array consistency

### ✅ Logic Flow Preserved
1. Mobile vs Desktop branching (unchanged)
2. Browser-specific detection order (unchanged)
3. Heuristics → Integrity → Interaction (unchanged)
4. Return values and error messages (unchanged)

## Integration with Your Backend

### Node.js / Express Example

```javascript
const express = require('express');
const axios = require('axios');

app.post('/api/submit-form', async (req, res) => {
  const { captchaToken, formData } = req.body;

  // Verify the captcha token with nCaptcha server
  const verification = await axios.post('http://localhost:8910/api/verify', {
    token: captchaToken
  }, {
    headers: {
      'User-Agent': req.headers['user-agent']
    }
  });

  if (!verification.data.valid) {
    return res.status(400).json({ error: 'Invalid captcha' });
  }

  // Process form submission
  // ...
});
```

### Python / Flask Example

```python
import requests
from flask import Flask, request, jsonify

@app.route('/api/submit-form', methods=['POST'])
def submit_form():
    captcha_token = request.json.get('captchaToken')

    # Verify with nCaptcha server
    response = requests.post('http://localhost:8910/api/verify', json={
        'token': captcha_token
    }, headers={
        'User-Agent': request.headers.get('User-Agent')
    })

    if not response.json().get('valid'):
        return jsonify({'error': 'Invalid captcha'}), 400

    # Process form
    # ...
```

### PHP Example

```php
<?php
function verifyCaptcha($token) {
    $ch = curl_init('http://localhost:8910/api/verify');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['token' => $token]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'User-Agent: ' . $_SERVER['HTTP_USER_AGENT']
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['valid'] ?? false;
}

if (!verifyCaptcha($_POST['captchaToken'])) {
    die('Invalid captcha');
}
?>
```

## Migration from Old Code

If you have existing implementations using the old client-side version:

### 1. Update HTML
```html
<!-- Old -->
<script type="module" src="js/Captcha.js"></script>

<!-- New -->
<script type="module" src="client/js/CaptchaWidget.js"></script>
```

### 2. Update Event Listener
```javascript
// The postMessage event remains the same
window.addEventListener('message', (event) => {
  if (event.data.type === 'ncaptcha-solved') {
    const token = event.data.token;
    // Send token to your backend for verification
  }
});
```

### 3. Backend Verification
Add server-side token verification (see examples above). This is **CRITICAL** - without server-side verification, the captcha provides no security.

## Production Deployment

### Recommended Setup

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   CDN / Nginx   │  ← Serve client/index.html
└───────┬─────────┘
        │
        ▼
┌─────────────────────────────┐
│  Load Balancer              │
└──────┬──────────────────────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Server 1 │  │ Server 2 │  │ Server N │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ Redis (Tokens) │
          └────────────────┘
```

### Using Redis for Token Storage

Replace in-memory Map with Redis:

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Store token
await redis.setex(token, 300, JSON.stringify(payload));

// Retrieve token
const data = await redis.get(token);
const payload = JSON.parse(data);
```

### Environment Variables

```env
# Production settings
NODE_ENV=production
PORT=8910
NPOW_SECRET=your-production-secret-very-long-and-random
ALLOWED_ORIGINS=https://yourdomain.com
STRICT_VALIDATION=true

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Security Recommendations

1. **HTTPS Only**: Always serve captcha over HTTPS
2. **Secret Rotation**: Rotate `NPOW_SECRET` periodically
3. **Rate Limiting**: Use nginx or middleware to limit requests
4. **CORS Configuration**: Restrict `ALLOWED_ORIGINS` to your domains
5. **Monitoring**: Log failed validation attempts
6. **Token Expiry**: Keep tokens short-lived (5 minutes recommended)

## Troubleshooting

### Client Can't Connect to Server
- Check CORS configuration in server
- Verify `API_BASE_URL` in `client/js/API.js`
- Ensure server is running on correct port

### Tokens Always Invalid
- Verify `NPOW_SECRET` is set in `.env`
- Check server logs for verification errors
- Ensure User-Agent is passed correctly

### All Requests Fail
- Check if `STRICT_VALIDATION=true` causing issues with mobile networks
- Verify requestData structure matches server expectations
- Check server logs for specific detection failures

## Comparison: Before vs After

| Feature | Client-Side (Old) | Server-Side (New) |
|---------|------------------|-------------------|
| **Detection Location** | Browser | Server ✅ |
| **Security** | Bypassable | Secure ✅ |
| **Detection Logic** | Exposed | Hidden ✅ |
| **Token Generation** | Client-side | Server-side ✅ |
| **Rate Limiting** | None | Built-in ✅ |
| **Scalability** | N/A | Horizontal ✅ |
| **Method Names** | Original | Preserved ✅ |
| **Detection Algorithms** | Original | Unchanged ✅ |
| **API Endpoints** | 1 | 3 ✅ |

## Support & Questions

For questions or issues with this refactoring:
1. Check this guide thoroughly
2. Review server logs for errors
3. Verify all environment variables are set
4. Test with browser dev tools to inspect network requests

## License

Same as original nCaptcha project (ISC)
