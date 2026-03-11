import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
import { PlatformType } from "@/lib/backend/types";

const EPIC_TOKEN_URL = "https://api.epicgames.dev/epic/oauth/v2/token";
const EPIC_USERINFO_URL = "https://api.epicgames.dev/epic/oauth/v2/userInfo";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("=== EPIC OAUTH CALLBACK ===");
  console.log("code:", code ? "present" : "missing");
  console.log("state:", state);
  console.log("error:", error);

  if (error) {
    return NextResponse.redirect(
      new URL(`/linked?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+code+or+state", request.url),
    );
  }

  const clientId = process.env.EPIC_CLIENT_ID;
  const clientSecret = process.env.EPIC_CLIENT_SECRET;
  const redirectBase = process.env.OAUTH_REDIRECT_BASE || "https://clipvault-six.vercel.app";
  const redirectUri = `${redirectBase}/api/auth/epic`;

  if (!clientId || !clientSecret) {
    console.error("[Epic] Missing EPIC_CLIENT_ID or EPIC_CLIENT_SECRET");
    return NextResponse.redirect(
      new URL("/linked?error=Epic+OAuth+not+configured", request.url),
    );
  }

  try {
    // Step 1: Exchange authorization code for access token
    console.log("[Epic] Exchanging code for token...");
    const tokenResponse = await fetch(EPIC_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Epic] Token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/linked?error=Failed+to+exchange+Epic+auth+code", request.url),
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("[Epic] Token exchange successful");

    // Step 2: Fetch user info to get Epic account ID
    console.log("[Epic] Fetching user info...");
    const userResponse = await fetch(EPIC_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[Epic] User info fetch failed:", userResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/linked?error=Failed+to+fetch+Epic+user+info", request.url),
      );
    }

    const userData = await userResponse.json();
    const epicAccountId = userData.sub || userData.accountId;
    const epicDisplayName = userData.preferred_username || userData.displayName;
    console.log("[Epic] Got account ID:", epicAccountId, "display name:", epicDisplayName);

    if (!epicAccountId) {
      console.error("[Epic] No account ID in user info response:", userData);
      return NextResponse.redirect(
        new URL("/linked?error=Could+not+get+Epic+account+ID", request.url),
      );
    }

    // Step 3: Link the account
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.EPIC,
      epicAccountId,
      epicDisplayName,
      accessToken,
    );

    console.log("[Epic] Account linked successfully for user:", userId);
    return NextResponse.redirect(
      new URL("/linked?platform=epic", request.url),
    );
  } catch (error) {
    console.error("[Epic] OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/linked?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`,
        request.url,
      ),
    );
  }
}
