import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
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
  const claimedId = params["openid.claimed_id"];
  const identity = params["openid.identity"];

  console.log("[Steam] Extracting Steam ID from:");
  console.log("  claimed_id:", claimedId);
  console.log("  identity:", identity);

  if (claimedId) {
    const match = claimedId.match(/\/id\/(\d+)$/);
    if (match) return match[1];

    const parts = claimedId.split("/");
    const lastPart = parts[parts.length - 1];
    if (/^\d{17}$/.test(lastPart)) {
      return lastPart;
    }
  }

  if (identity) {
    const match = identity.match(/\/id\/(\d+)$/);
    if (match) return match[1];

    const parts = identity.split("/");
    const lastPart = parts[parts.length - 1];
    if (/^\d{17}$/.test(lastPart)) {
      return lastPart;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  console.log("=== STEAM OAUTH CALLBACK ===");
  console.log("Full URL:", request.url);
  console.log("All params:", JSON.stringify(params, null, 2));

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
    console.error("[Steam] Invalid mode:", mode);
    return NextResponse.redirect(
      new URL("/linked?error=Invalid+OpenID+response+mode", request.url),
    );
  }

  if (!state) {
    console.error("[Steam] Missing state parameter");
    return NextResponse.redirect(
      new URL("/linked?error=Missing+state+parameter", request.url),
    );
  }

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

  const isValid = await validateSteamResponse(params);
  if (!isValid) {
    console.error("[Steam] Signature validation failed");
    return NextResponse.redirect(
      new URL("/linked?error=Steam+signature+validation+failed", request.url),
    );
  }

  console.log("[Steam] Signature validated successfully");

  try {
    await accountService.linkAccount(
      state,
      PlatformType.STEAM,
      steamId,
      undefined,
      undefined,
    );
    console.log("[Steam] Account linked successfully for user:", state);
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
