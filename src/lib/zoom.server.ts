import { createHmac, randomBytes } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function signState(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildSignedState(userId: string): string {
  const secret = process.env.ZOOM_OAUTH_STATE_SECRET;
  if (!secret) throw new Error("ZOOM_OAUTH_STATE_SECRET is not configured");
  const body = { u: userId, t: Date.now(), n: randomBytes(12).toString("hex") };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = signState(payload, secret);
  return `${payload}.${sig}`;
}

export function verifySignedState(
  state: string,
): { ok: true; userId: string } | { ok: false; reason: string } {
  const secret = process.env.ZOOM_OAUTH_STATE_SECRET;
  if (!secret) return { ok: false, reason: "missing_secret" };
  if (!state || typeof state !== "string" || !state.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payload, sig] = state.split(".");
  const expected = signState(payload, secret);
  if (sig.length !== expected.length) return { ok: false, reason: "bad_signature" };
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return { ok: false, reason: "bad_signature" };
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u: string; t: number; n: string;
    };
    if (!body.u || typeof body.t !== "number") return { ok: false, reason: "malformed_payload" };
    if (Date.now() - body.t > STATE_TTL_MS) return { ok: false, reason: "expired" };
    return { ok: true, userId: body.u };
  } catch {
    return { ok: false, reason: "decode_failed" };
  }
}
