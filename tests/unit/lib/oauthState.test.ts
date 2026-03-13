import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("oauthState", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.stubEnv("OAUTH_STATE_SECRET", "test-oauth-state-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and verifies a signed state token", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "../../../src/utils/oauthState"
    );

    const token = createOAuthState({
      userId: "user-123",
      platform: "steam",
      nowMs: 1_700_000_000_000,
    });

    const result = verifyOAuthState(token, {
      expectedPlatform: "steam",
      nowMs: 1_700_000_100_000,
    });

    expect(result.valid).toBe(true);
    expect(result.payload).toMatchObject({
      userId: "user-123",
      platform: "steam",
    });
  });

  it("rejects tampered tokens", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "../../../src/utils/oauthState"
    );

    const token = createOAuthState({
      userId: "user-123",
      platform: "riot",
      nowMs: 1_700_000_000_000,
    });

    const tampered = `${token.slice(0, -1)}x`;
    const result = verifyOAuthState(tampered, { expectedPlatform: "riot" });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_signature");
  });

  it("rejects expired tokens", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "../../../src/utils/oauthState"
    );

    const token = createOAuthState({
      userId: "user-123",
      platform: "epic",
      ttlSeconds: 60,
      nowMs: 1_700_000_000_000,
    });

    const result = verifyOAuthState(token, {
      expectedPlatform: "epic",
      nowMs: 1_700_000_061_000,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("rejects platform mismatches", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "../../../src/utils/oauthState"
    );

    const token = createOAuthState({
      userId: "user-123",
      platform: "steam",
      nowMs: 1_700_000_000_000,
    });

    const result = verifyOAuthState(token, {
      expectedPlatform: "riot",
      nowMs: 1_700_000_010_000,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("platform_mismatch");
  });

  it("fails without any configured secret", async () => {
    vi.unstubAllEnvs();
    vi.resetModules();

    const { verifyOAuthState } = await import(
      "../../../src/utils/oauthState"
    );

    const result = verifyOAuthState("invalid.token");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_secret");
  });
});
