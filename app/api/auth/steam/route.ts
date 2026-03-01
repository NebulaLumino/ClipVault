import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/backend/services/AccountService";
import { PlatformType } from "@/lib/backend/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const claimedId = searchParams.get("openid_claimed_id");
  const steamId = claimedId ? claimedId.split("/").pop() : undefined;

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+code+or+state", request.url)
    );
  }

  if (!steamId) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+Steam+ID", request.url)
    );
  }

  try {
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.STEAM,
      steamId,
      undefined,
      code
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
