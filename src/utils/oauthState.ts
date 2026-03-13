import crypto from "crypto";

export type OAuthPlatform = "steam" | "riot" | "epic";

export interface OAuthStatePayload {
  userId: string;
  platform: OAuthPlatform;
  iat: number;
  exp: number;
}

export interface CreateOAuthStateOptions {
  userId: string;
  platform: OAuthPlatform;
  ttlSeconds?: number;
  nowMs?: number;
}

export interface VerifyOAuthStateOptions {
  expectedPlatform?: OAuthPlatform;
  nowMs?: number;
}

export interface VerifyOAuthStateResult {
  valid: boolean;
  payload?: OAuthStatePayload;
  reason?: string;
}

const DEFAULT_TTL_SECONDS = 15 * 60;

function resolveStateSecret(): string | null {
  return (
    process.env.OAUTH_STATE_SECRET ||
    process.env.DISCORD_CLIENT_SECRET ||
    process.env.DISCORD_BOT_TOKEN ||
    null
  );
}

function signPayload(encodedPayload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function createOAuthState({
  userId,
  platform,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  nowMs = Date.now(),
}: CreateOAuthStateOptions): string {
  const secret = resolveStateSecret();

  if (!secret) {
    throw new Error(
      "OAuth state secret is not configured. Set OAUTH_STATE_SECRET (preferred) or DISCORD_CLIENT_SECRET.",
    );
  }

  const issuedAt = Math.floor(nowMs / 1000);
  const payload: OAuthStatePayload = {
    userId,
    platform,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyOAuthState(
  token: string,
  { expectedPlatform, nowMs = Date.now() }: VerifyOAuthStateOptions = {},
): VerifyOAuthStateResult {
  const secret = resolveStateSecret();

  if (!secret) {
    return {
      valid: false,
      reason: "missing_secret",
    };
  }

  const [encodedPayload, providedSignature, ...rest] = token.split(".");

  if (!encodedPayload || !providedSignature || rest.length > 0) {
    return {
      valid: false,
      reason: "malformed_token",
    };
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!safeCompare(providedSignature, expectedSignature)) {
    return {
      valid: false,
      reason: "invalid_signature",
    };
  }

  let payload: OAuthStatePayload;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as OAuthStatePayload;
  } catch {
    return {
      valid: false,
      reason: "invalid_payload",
    };
  }

  if (
    !payload ||
    typeof payload.userId !== "string" ||
    !payload.userId ||
    (payload.platform !== "steam" &&
      payload.platform !== "riot" &&
      payload.platform !== "epic") ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return {
      valid: false,
      reason: "invalid_payload",
    };
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  if (payload.exp < nowSeconds) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  if (payload.iat > nowSeconds + 60) {
    return {
      valid: false,
      reason: "issued_in_future",
    };
  }

  if (expectedPlatform && payload.platform !== expectedPlatform) {
    return {
      valid: false,
      reason: "platform_mismatch",
    };
  }

  return {
    valid: true,
    payload,
  };
}
