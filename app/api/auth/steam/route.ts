import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
import { verifyOAuthState } from "@/src/utils/oauthState";
import { PlatformType } from "@/lib/backend/types";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

async function validateSteamResponse(
  params: Record<string, string>,
): Promise<boolean> {
  const validationParams = new URLSearchParams({
    "openid.assoc_handle": params["openid.assoc_handle"] || "",
    "openid.signed": params["openid.signed"] || "",
    "openid.sig": params["openid.sig"] || "",
    "openid.ns": params["openid.ns"] || "http://specs.openid.net/auth/2.0",
    "openid.mode": "check_authentication",
  });

  const signedFields = (params["openid.signed"] || "").split(",");
  for (const field of signedFields) {
    const value = params[`openid.${field}`];
    if (value !== undefined) {
      validationParams.set(`openid.${field}`, value);
    }
  }

  try {
    const response = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: validationParams.toString(),
    });

    const text = await response.text();
    console.log("[Steam] Validation response:", text);

    return text.includes("is_valid:true");
  } catch (error) {
    console.error("[Steam] Validation error:", error);
    return false;
  }
}

function extractSteamId(params: Record<string, string>): string | null {
  let claimedId = params["openid.claimed_id"];
  let identity = params["openid.identity"];

  console.log("[Steam] Extracting Steam ID from:");
  console.log("  claimed_id:", claimedId);
  console.log("  identity:", identity);

  // If claimed_id is still a generic OpenID URL, Steam didn't authenticate properly
  if (
    claimedId &&
    !claimedId.includes("steamcommunity.com/openid/id/")
  ) {
    console.log(
      "[Steam] ERROR: claimed_id is not a Steam profile URL - user may not have completed auth",
    );
    return null;
  }

  if (
    identity &&
    !identity.includes("steamcommunity.com/openid/id/")
  ) {
    console.log(
      "[Steam] ERROR: identity is not a Steam profile URL - user may not have completed auth",
    );
    return null;
  }

  if (claimedId) {
    // Try to extract Steam ID from URL like http://steamcommunity.com/openid/id/765611980281XXXXX
    const match = claimedId.match(/\/id\/(\d+)/);
    if (match) return match[1];

    // Also try just numbers at the end
    const numMatch = claimedId.match(/(\d{17})/);
    if (numMatch) return numMatch[1];
  }

  if (identity) {
    const match = identity.match(/\/id\/(\d+)/);
    if (match) return match[1];

    const numMatch = identity.match(/(\d{17})/);
    if (numMatch) return numMatch[1];
  }

  return null;
}

export async function GET(request: NextRequest) {
  // Get all params properly - including those with dots
  const params: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    params[key] = value;
  }

  console.log("=== STEAM OAUTH CALLBACK ===");
  console.log("Full URL:", request.url);
  console.log("All params:", JSON.stringify(params, null, 2));
  console.log("Mode param:", params["openid.mode"]);
  console.log("claimed_id param:", params["openid.claimed_id"]);
  console.log("identity param:", params["openid.identity"]);

  const mode = params["openid.mode"];
  const state = params["state"];
  const openIdError = params["openid.error"];
  const openIdErrorDesc = params["openid.error_description"];

  if (mode === "error" || openIdError || openIdErrorDesc) {
    console.error("[Steam] OpenID error:", openIdError, openIdErrorDesc);
    return NextResponse.redirect(
      new URL(
        `/linked?error=${encodeURIComponent(openIdErrorDesc || openIdError || "Steam authentication failed")}`,
        request.url,
      ),
    );
  }

  if (mode !== "id_res") {
    // If mode is checkid_setup or not present, this is the initial request, not the callback
    console.error(
      "[Steam] Invalid mode:",
      mode,
      "- This might be the initial request, not callback",
    );
    return NextResponse.redirect(
      new URL(
        "/linked?error=Steam+auth+not+completed+or+invalid+mode",
        request.url,
      ),
    );
  }

  if (!state) {
    console.error("[Steam] Missing state parameter");
    return NextResponse.redirect(
      new URL("/linked?error=Missing+state+parameter", request.url),
    );
  }

  const stateResult = verifyOAuthState(state, { expectedPlatform: "steam" });
  if (!stateResult.valid || !stateResult.payload) {
    console.error("[Steam] Invalid OAuth state", { reason: stateResult.reason });
    return NextResponse.redirect(
      new URL("/linked?error=Invalid+or+expired+Steam+link+session", request.url),
    );
  }

  const userId = stateResult.payload.userId;

  const steamId = extractSteamId(params);
  if (!steamId) {
    console.error("[Steam] Could not extract Steam ID from response");
    return NextResponse.redirect(
      new URL(
        "/linked?error=Could+not+extract+Steam+ID+from+response",
        request.url,
      ),
    );
  }

  console.log("[Steam] Extracted Steam ID:", steamId);

  // Validate the Steam response if signed params are present
  const signed = params["openid.signed"];
  const sig = params["openid.sig"];

  if (signed && sig) {
    const isValid = await validateSteamResponse(params);
    if (!isValid) {
      console.error("[Steam] Signature validation failed");
      return NextResponse.redirect(
        new URL("/linked?error=Steam+signature+validation+failed", request.url),
      );
    }
    console.log("[Steam] Signature validated successfully");
  } else {
    console.log("[Steam] No signature params - skipping validation (dev mode)");
  }

  try {
    await accountService.linkAccount(
      userId,
      PlatformType.STEAM,
      steamId,
      undefined,
      undefined,
    );
    console.log("[Steam] Account linked successfully for user:", userId);
    return NextResponse.redirect(
      new URL("/linked?platform=steam", request.url),
    );
  } catch (error) {
    console.error("[Steam] Link account error:", error);
    return NextResponse.redirect(
      new URL(
        `/linked?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`,
        request.url,
      ),
    );
  }
}
