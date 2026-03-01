import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+code+or+state", request.url)
    );
  }

  try {
    const userId = state;
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/oauth/riot/callback?code=${code}&state=${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to link account');
    }

    return NextResponse.redirect(
      new URL("/linked?platform=riot", request.url)
    );
  } catch (error) {
    console.error("Riot OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/linked?error=Failed+to+link+account", request.url)
    );
  }
}
