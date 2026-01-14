import express from "express";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(express.json());

const PORT = 8910;

const clearanceStore = new Map();

const CLEARANCE_TTL_MINUTES = 60;

function generateHash() {
  return crypto.randomBytes(32).toString("hex");
}

function now() {
  return Date.now();
}

function expiresAt(minutes) {
  return now() + minutes * 60 * 1000;
}

/**
 * Helper to get real client IP
 */
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    ""
  );
}
app.use(
  cors({
    origin: "*", // or "http://127.0.0.1:5500"
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.post("/api", (req, res) => {
  const { requestHash, useragent } = req.body;
  const clientIP = getClientIP(req);

  if (!useragent) {
    return res.status(400).json({ success: false });
  }

  /**
   * CASE 1: Hash provided → validate
   */
  if (requestHash) {
    const entry = clearanceStore.get(requestHash);

    if (!entry) return res.json({ success: false });

    if (entry.expires < now()) {
      clearanceStore.delete(requestHash);
      return res.json({ success: false });
    }

    if (entry.userAgent !== useragent || entry.ip !== clientIP) {
      return res.json({ success: false });
    }

    return res.json({ success: true });
  }

  /**
   * CASE 2: No hash → issue new clearance
   */
  const newHash = generateHash();
  clearanceStore.set(newHash, {
    userAgent: useragent,
    ip: clientIP,
    expires: expiresAt(CLEARANCE_TTL_MINUTES),
  });

  return res.json({
    success: true,
    hash: newHash,
    expiresInMinutes: CLEARANCE_TTL_MINUTES,
  });
});

app.listen(PORT, () => {
  console.log(`nPow API running on http://127.0.0.1:${PORT}`);
});
