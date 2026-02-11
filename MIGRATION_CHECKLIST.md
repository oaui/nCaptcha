# Migration Checklist - Client to Server-Side

Use this checklist to migrate from the old client-side implementation to the new secure server-side architecture.

## Pre-Migration

- [ ] **Backup your current code**
  ```bash
  cp -r js js.backup
  cp -r node node.backup
  ```

- [ ] **Review current integration**
  - [ ] Document where captcha is used
  - [ ] Note any custom modifications
  - [ ] List all endpoints using captcha

## Server Setup

- [ ] **Install server dependencies**
  ```bash
  cd server
  npm install
  ```

- [ ] **Generate secure secret**
  ```bash
  openssl rand -base64 32
  ```

- [ ] **Configure environment**
  - [ ] Copy `.env.example` to `.env`
  - [ ] Set `NPOW_SECRET`
  - [ ] Configure `ALLOWED_ORIGINS`
  - [ ] Set `PORT` (default: 8910)
  - [ ] Choose `STRICT_VALIDATION` setting

- [ ] **Test server startup**
  ```bash
  npm start
  ```
  Expected: "nCaptcha Validation Server running..."

- [ ] **Test API endpoints**
  - [ ] GET `/api/challenge` returns challengeId
  - [ ] POST `/api/validate` accepts data
  - [ ] POST `/api/verify` validates tokens

## Client Setup

- [ ] **Update HTML file**
  ```html
  <!-- Replace -->
  <script type="module" src="js/Captcha.js"></script>

  <!-- With -->
  <script type="module" src="client/js/CaptchaWidget.js"></script>
  ```

- [ ] **Update asset paths**
  - [ ] Logo: `/img/logo_lock.png`
  - [ ] Fonts: Google Fonts CDN
  - [ ] Styles: Embedded in widget

- [ ] **Configure API endpoint**
  Edit `client/js/API.js`:
  ```javascript
  const API_BASE_URL = "http://your-server:8910";
  ```

- [ ] **Test widget**
  - [ ] Slider mode displays
  - [ ] Invisible mode works
  - [ ] Network requests to server succeed

## Backend Integration

- [ ] **Add token verification to your endpoints**

  Example structure:
  ```javascript
  async function verifyCaptcha(token) {
    const response = await fetch('http://localhost:8910/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    return data.valid;
  }
  ```

- [ ] **Update form handlers**
  - [ ] Extract captcha token from request
  - [ ] Call verification endpoint
  - [ ] Handle invalid token response
  - [ ] Log verification failures

- [ ] **Test full flow**
  1. User completes captcha → gets token
  2. Form submitted with token
  3. Backend verifies token
  4. Success: Process form
  5. Failure: Reject request

## Detection Verification

Verify that all detection logic works:

- [ ] **Desktop browser detection**
  - [ ] Playwright detection works
  - [ ] Puppeteer detection works
  - [ ] Selenium detection works

- [ ] **Mobile browser support**
  - [ ] Mobile UI displays correctly
  - [ ] Touch events captured
  - [ ] Detection skips desktop-only checks

- [ ] **Interaction analysis**
  - [ ] Mouse movements captured
  - [ ] Pointer events tracked
  - [ ] Click durations recorded
  - [ ] Linear movement detection works

- [ ] **Integrity checks**
  - [ ] Webdriver flag detected
  - [ ] Function patching detected
  - [ ] Automation markers detected

## Security Checklist

- [ ] **Server hardening**
  - [ ] HTTPS enabled (production)
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled
  - [ ] Secret key is strong (32+ chars)
  - [ ] Secret key is not in git

- [ ] **Token security**
  - [ ] Tokens expire (5 minutes)
  - [ ] Tokens are HMAC signed
  - [ ] Signature verification works
  - [ ] Old tokens are rejected

- [ ] **Client security**
  - [ ] No detection logic in client code
  - [ ] No secrets in client code
  - [ ] API endpoints use HTTPS
  - [ ] Cookies are Secure + SameSite

## Testing

- [ ] **Functional testing**
  - [ ] Valid user passes captcha
  - [ ] Invalid data rejected
  - [ ] Expired challenge rejected
  - [ ] Expired token rejected
  - [ ] Rate limiting blocks spam

- [ ] **Bot detection testing**
  - [ ] Test with Selenium (should fail)
  - [ ] Test with Puppeteer (should fail)
  - [ ] Test with Playwright (should fail)
  - [ ] Test with manual browser (should pass)

- [ ] **Edge cases**
  - [ ] Mobile network (IP changes)
  - [ ] Incognito mode
  - [ ] Different browsers
  - [ ] Slow networks
  - [ ] Server restart (tokens invalidated)

## Performance Testing

- [ ] **Load testing**
  - [ ] Server handles concurrent requests
  - [ ] Token storage doesn't leak memory
  - [ ] Challenge cleanup works
  - [ ] Response times acceptable (<200ms)

- [ ] **Client performance**
  - [ ] Widget loads quickly
  - [ ] UI animations smooth
  - [ ] No console errors
  - [ ] Mobile performance good

## Production Deployment

- [ ] **Environment setup**
  - [ ] Production `.env` configured
  - [ ] `NODE_ENV=production`
  - [ ] Appropriate `ALLOWED_ORIGINS`
  - [ ] Monitoring configured

- [ ] **Server deployment**
  - [ ] Process manager (PM2, systemd)
  - [ ] Reverse proxy (nginx, Caddy)
  - [ ] SSL/TLS certificates
  - [ ] Logging configured
  - [ ] Health checks enabled

- [ ] **Client deployment**
  - [ ] Static files on CDN
  - [ ] Correct API_BASE_URL
  - [ ] Assets served with caching headers
  - [ ] Gzip/Brotli compression

- [ ] **Monitoring**
  - [ ] Server logs
  - [ ] Error tracking (Sentry, etc.)
  - [ ] Uptime monitoring
  - [ ] Performance metrics
  - [ ] Failed validation alerts

## Rollback Plan

In case of issues:

- [ ] **Preparation**
  - [ ] Keep old code in `js.backup/`
  - [ ] Document rollback steps
  - [ ] Test rollback procedure

- [ ] **Rollback steps**
  1. Stop new server
  2. Restore old client code
  3. Restart old server
  4. Update DNS/nginx config
  5. Monitor for issues

## Documentation

- [ ] **Internal documentation**
  - [ ] Architecture diagram
  - [ ] API documentation
  - [ ] Deployment guide
  - [ ] Troubleshooting guide

- [ ] **Developer documentation**
  - [ ] Integration examples
  - [ ] Testing guide
  - [ ] Common issues
  - [ ] Best practices

## Sign-Off

- [ ] **Development team**
  - Name: _______________ Date: ___/___/___
  - Verified: Code changes complete

- [ ] **QA team**
  - Name: _______________ Date: ___/___/___
  - Verified: All tests pass

- [ ] **Security team**
  - Name: _______________ Date: ___/___/___
  - Verified: Security requirements met

- [ ] **DevOps team**
  - Name: _______________ Date: ___/___/___
  - Verified: Deployment successful

## Post-Migration

- [ ] **Monitor for 24-48 hours**
  - [ ] Check error rates
  - [ ] Verify success rates
  - [ ] Monitor performance
  - [ ] Review logs

- [ ] **Optimization**
  - [ ] Tune rate limiting
  - [ ] Optimize token storage
  - [ ] Adjust validation strictness
  - [ ] Add caching if needed

- [ ] **Cleanup**
  - [ ] Remove old client code (after testing period)
  - [ ] Update documentation
  - [ ] Archive old server
  - [ ] Remove unused dependencies

---

## Migration Complete! 🎉

Once all items are checked, your migration to the secure server-side architecture is complete.

**Next steps:**
1. Monitor production for a few days
2. Gather user feedback
3. Optimize based on metrics
4. Consider Redis for high-traffic scenarios

**Questions?** Refer to `REFACTORING_GUIDE.md` for detailed documentation.
