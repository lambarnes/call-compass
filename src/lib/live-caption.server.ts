import { createHash } from "node:crypto";
import { randomBytes } from "node:crypto";

export function generateIngestToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(48).toString("base64url");
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash };
}

export function hashIngestToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export async function validateIngestToken(
  supabase: any,
  callId: string,
  plaintextToken: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  if (!callId || !plaintextToken) {
    return { valid: false, error: "Missing callId or token" };
  }

  const providedHash = hashIngestToken(plaintextToken);

  const { data: call, error } = await supabase
    .from("calls")
    .select("id, user_id, live_ingest_token_hash, status")
    .eq("id", callId)
    .single();

  if (error || !call) {
    return { valid: false, error: "Call not found" };
  }

  if (!call.live_ingest_token_hash) {
    return { valid: false, error: "No ingest token configured for this call" };
  }

  const storedHash = call.live_ingest_token_hash;
  let diff = 0;
  const minLen = Math.min(providedHash.length, storedHash.length);
  for (let i = 0; i < minLen; i++) {
    diff |= providedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  diff |= providedHash.length ^ storedHash.length;

  if (diff !== 0) {
    return { valid: false, error: "Invalid token" };
  }

  if (!["ready", "live"].includes(call.status)) {
    return { valid: false, error: "Call not in caption-ready state" };
  }

  return { valid: true, userId: call.user_id };
}
