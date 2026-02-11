import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import { start as startDetection } from "./detection/Detection.js";
import { Config } from "./obj/Config.js";
import { RequestData } from "./obj/RequestData.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8910;
const SECRET = process.env.NPOW_SECRET;

if (!SECRET) {
  console.error("CRITICAL: NPOW_SECRET environment variable is not set!");
  process.exit(1);
}

// In-memory token storage (in production, use Redis or similar)
const tokenStore = new Map();

/**
 * Helper to get real client IP
 */
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    ""
  );
}

/**
 * Sign a payload with HMAC-SHA256
 */
function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Verify and decode a token
 */
function verifyToken(token) {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(body)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());

    if (payload.exp < Date.now()) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a unique challenge ID for each captcha attempt
 */
function generateChallengeId() {
  return crypto.randomBytes(16).toString("hex");
}

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
      : "*",
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Captcha-Token", "User-Agent"],
    credentials: true,
  })
);

/**
 * ENDPOINT: GET /api/health
 * Purpose: Health check and CORS test
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "nCaptcha server is running",
    cors: "enabled",
    timestamp: Date.now(),
  });
});

/**
 * ENDPOINT: GET /api/challenge
 * Purpose: Initialize a new captcha challenge
 * Returns: Challenge ID to be used by the client
 */
app.get("/api/challenge", (req, res) => {
  const challengeId = generateChallengeId();
  const timestamp = Date.now();

  // Store challenge with 5 minute expiry
  tokenStore.set(challengeId, {
    created: timestamp,
    expires: timestamp + 5 * 60 * 1000,
    attempts: 0,
  });

  res.json({
    success: true,
    challengeId,
    expiresInMinutes: 5,
  });
});

/**
 * ENDPOINT: POST /api/validate
 * Purpose: Validate captcha submission with full server-side detection
 * Body: {
 *   challengeId: string,
 *   requestData: object (browser fingerprint),
 *   interactionData: object (mouse/pointer events),
 *   mode: object (slider/invisible/click)
 * }
 */
app.post("/api/validate", async (req, res) => {
  try {
    const { challengeId, requestData, interactionData, mode } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";

    // Validate required fields
    if (!challengeId || !requestData || !mode) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check if challenge exists and is valid
    const challenge = tokenStore.get(challengeId);
    if (!challenge) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired challenge",
      });
    }

    if (Date.now() > challenge.expires) {
      tokenStore.delete(challengeId);
      return res.status(400).json({
        success: false,
        error: "Challenge expired",
      });
    }

    // Rate limiting: max 3 attempts per challenge
    challenge.attempts += 1;
    if (challenge.attempts > 3) {
      tokenStore.delete(challengeId);
      return res.status(429).json({
        success: false,
        error: "Too many attempts",
      });
    }

    // === SERVER-SIDE DETECTION ===
    // Build config object with all data
    const config = new Config();
    config.data.requestData = new RequestData(requestData);
    config.data.interactionData = interactionData || {
      mouseMovements: [],
      pointerEvents: [],
      pointerClickDurations: [],
      clicks: [],
    };
    config.settings.mode = mode;

    // Run detection logic (ALL logic preserved from client)
    const detectionResult = await startDetection(config);

    if (detectionResult.automated) {
      // Detection failed - bot detected
      tokenStore.delete(challengeId);
      return res.json({
        success: false,
        validationSuccess: false,
        reason: detectionResult.reason,
      });
    }

    // Detection passed - generate token
    const payload = {
      challengeId,
      ua: userAgent,
      ip: clientIP,
      iat: Date.now(),
      exp: Date.now() + 5 * 60 * 1000, // 5 minutes
      mode: mode.invisible ? "invisible" : mode.slider ? "slider" : "click",
    };

    const token = signPayload(payload);

    // Store token for verification
    tokenStore.set(token, {
      ...payload,
      verified: true,
    });

    // Clean up challenge
    tokenStore.delete(challengeId);

    return res.json({
      success: true,
      validationSuccess: true,
      token,
      expiresInMinutes: 5,
    });
  } catch (err) {
    console.error("Validation error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * ENDPOINT: POST /api/verify
 * Purpose: Verify an existing token (for your backend to check)
 * Body: {
 *   token: string
 * }
 */
app.post("/api/verify", (req, res) => {
  const { token } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = req.headers["user-agent"] || "";

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token required",
    });
  }

  // Verify token signature and expiry
  const payload = verifyToken(token);
  if (!payload) {
    return res.json({
      success: false,
      valid: false,
      error: "Invalid or expired token",
    });
  }

  // Check if token exists in store
  const storedToken = tokenStore.get(token);
  if (!storedToken || !storedToken.verified) {
    return res.json({
      success: false,
      valid: false,
      error: "Token not found or not verified",
    });
  }

  // Optional: Verify IP and User-Agent match (can be disabled for mobile networks)
  const strictValidation = process.env.STRICT_VALIDATION === "true";
  if (strictValidation) {
    if (payload.ua !== userAgent || payload.ip !== clientIP) {
      return res.json({
        success: false,
        valid: false,
        error: "Token fingerprint mismatch",
      });
    }
  }

  return res.json({
    success: true,
    valid: true,
    mode: payload.mode,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  });
});

/**
 * Cleanup expired tokens every minute
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires && value.expires < now) {
      tokenStore.delete(key);
    }
    if (value.exp && value.exp < now) {
      tokenStore.delete(key);
    }
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`nCaptcha Validation Server running on http://127.0.0.1:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Strict validation: ${process.env.STRICT_VALIDATION === "true"}`);
});
