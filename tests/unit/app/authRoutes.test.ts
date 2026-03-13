import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const linkAccountMock = vi.fn();
const fetchMock = vi.fn();
const FIXED_NOW = new Date("2023-11-14T22:15:00.000Z");

vi.mock("@/lib/backend/services/AccountService", () => ({
  accountService: {
    linkAccount: linkAccountMock,
  },
}));

vi.mock("@/lib/backend/types", () => ({
  PlatformType: {
    STEAM: "STEAM",
    RIOT: "RIOT",
    EPIC: "EPIC",
  },
}));

describe("auth callback routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OAUTH_STATE_SECRET", "test-oauth-state-secret");
    vi.stubEnv("RIOT_CLIENT_ID", "riot-client-id");
    vi.stubEnv("RIOT_CLIENT_SECRET", "riot-client-secret");
    vi.stubEnv("EPIC_CLIENT_ID", "epic-client-id");
    vi.stubEnv("EPIC_CLIENT_SECRET", "epic-client-secret");
    vi.stubEnv("OAUTH_REDIRECT_BASE", "https://clipvault.example.com");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("redirects Steam callbacks with tampered state before linking", async () => {
    const { createOAuthState } = await import("@/src/utils/oauthState");
    const { GET } = await import("@/app/api/auth/steam/route");

    const validState = createOAuthState({
      userId: "user-123",
      platform: "steam",
      nowMs: FIXED_NOW.getTime(),
    });
    const tamperedState = `${validState.slice(0, -1)}x`;

    const request = new NextRequest(
      `https://clipvault.example.com/api/auth/steam?openid.mode=id_res&openid.claimed_id=${encodeURIComponent(
        "https://steamcommunity.com/openid/id/76561198028123456",
      )}&openid.identity=${encodeURIComponent(
        "https://steamcommunity.com/openid/id/76561198028123456",
      )}&state=${encodeURIComponent(tamperedState)}`,
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://clipvault.example.com/linked?error=Invalid+or+expired+Steam+link+session",
    );
    expect(linkAccountMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects Riot callbacks with platform-mismatched state before token exchange", async () => {
    const { createOAuthState } = await import("@/src/utils/oauthState");
    const { GET } = await import("@/app/api/auth/riot/route");

    const mismatchedState = createOAuthState({
      userId: "user-123",
      platform: "steam",
      nowMs: FIXED_NOW.getTime(),
    });

    const request = new NextRequest(
      `https://clipvault.example.com/api/auth/riot?code=test-code&state=${encodeURIComponent(mismatchedState)}`,
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://clipvault.example.com/linked?error=Invalid+or+expired+Riot+link+session",
    );
    expect(linkAccountMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects Epic callbacks with expired state before token exchange", async () => {
    const { createOAuthState } = await import("@/src/utils/oauthState");
    const { GET } = await import("@/app/api/auth/epic/route");

    const expiredState = createOAuthState({
      userId: "user-123",
      platform: "epic",
      ttlSeconds: 60,
      nowMs: new Date("2023-11-14T22:13:20.000Z").getTime(),
    });

    const request = new NextRequest(
      `https://clipvault.example.com/api/auth/epic?code=test-code&state=${encodeURIComponent(expiredState)}`,
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://clipvault.example.com/linked?error=Invalid+or+expired+Epic+link+session",
    );
    expect(linkAccountMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
