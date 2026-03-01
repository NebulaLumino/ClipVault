import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
import { PlatformType } from "@/lib/backend/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("openid.mode");
  const state = searchParams.get("state");
  const claimedId = searchParams.get("openid.claimed_id");
  const identity = searchParams.get("openid.identity");
  const steamId = claimedId ? claimedId.split("/").pop() : identity?.split("/").pop() : undefined;

  // Handle Steam OpenID error
  if (mode === "error") {
    const error = searchParams.get("openid.error") || "Unknown error";
    return NextResponse.redirect(
      new URL(`/linked?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Steam OpenID success response (mode = "id_res")
  if (!state || !steamId) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+state+or+Steam+ID", request.url)
    );
  }

  try {
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.STEAM,
      steamId,
      undefined,
      undefined
    );

    return NextResponse.redirect(
      new URL("/linked?platform=steam", request.url)
    );
  } catch (error) {
    console.error("Steam OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/linked?error=Failed+to+link+account", request.url)
    );
  }
}
