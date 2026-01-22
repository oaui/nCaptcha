import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 8910;

const SECRET = process.env.NPOW_SECRET;

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
function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");

  return `${body}.${sig}`;
}

function verifyToken(token) {
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
}

app.use(
  cors({
    origin: "*", // or "http://127.0.0.1:5500"
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.post("/api", (req, res) => {
  const { requestHash, useragent } = req.body;
  const clientIP = getClientIP(req);

  if (!useragent) {
    return res.json({ success: false });
  }

  /**
   * CASE 1: Validate existing token
   */
  if (requestHash) {
    const payload = verifyToken(requestHash);
    if (!payload) {
      return res.json({ success: false });
    }

    if (payload.ua !== useragent || payload.ip !== clientIP) {
      return res.json({ success: false });
    }

    return res.json({ success: true });
  }

  /**
   * CASE 2: Issue new token
   */
  const payload = {
    ua: useragent,
    ip: clientIP,
    iat: Date.now(),
    exp: Date.now() + 5 * 60 * 1000, // 5 min
  };

  const token = signPayload(payload);

  return res.json({
    success: true,
    hash: token,
    expiresInMinutes: 5,
  });
});

app.listen(PORT, () => {
  console.log(`nPow API running on http://127.0.0.1:${PORT}`);
});
