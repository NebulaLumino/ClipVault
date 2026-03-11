import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
import { PlatformType } from "@/lib/backend/types";

const RIOT_TOKEN_URL = "https://auth.riotgames.com/token";
const RIOT_USERINFO_URL = "https://auth.riotgames.com/userinfo";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("=== RIOT OAUTH CALLBACK ===");
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

  const clientId = process.env.RIOT_CLIENT_ID;
  const clientSecret = process.env.RIOT_CLIENT_SECRET;
  const redirectBase = process.env.OAUTH_REDIRECT_BASE || "https://clipvault-six.vercel.app";
  const redirectUri = `${redirectBase}/api/auth/riot`;

  if (!clientId || !clientSecret) {
    console.error("[Riot] Missing RIOT_CLIENT_ID or RIOT_CLIENT_SECRET");
    return NextResponse.redirect(
      new URL("/linked?error=Riot+OAuth+not+configured", request.url),
    );
  }

  try {
    // Step 1: Exchange authorization code for access token
    console.log("[Riot] Exchanging code for token...");
    const tokenResponse = await fetch(RIOT_TOKEN_URL, {
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
      console.error("[Riot] Token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/linked?error=Failed+to+exchange+Riot+auth+code", request.url),
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("[Riot] Token exchange successful");

    // Step 2: Fetch user info to get PUUID
    console.log("[Riot] Fetching user info...");
    const userResponse = await fetch(RIOT_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[Riot] User info fetch failed:", userResponse.status, errorText);
      return NextResponse.redirect(
        new URL("/linked?error=Failed+to+fetch+Riot+user+info", request.url),
      );
    }

    const userData = await userResponse.json();
    const puuid = userData.sub;
    console.log("[Riot] Got PUUID:", puuid);

    if (!puuid) {
      console.error("[Riot] No PUUID in user info response:", userData);
      return NextResponse.redirect(
        new URL("/linked?error=Could+not+get+Riot+account+ID", request.url),
      );
    }

    // Step 3: Link the account
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.RIOT,
      puuid,
      undefined,
      accessToken,
    );

    console.log("[Riot] Account linked successfully for user:", userId);
    return NextResponse.redirect(
      new URL("/linked?platform=riot", request.url),
    );
  } catch (error) {
    console.error("[Riot] OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/linked?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`,
        request.url,
      ),
    );
  }
}
