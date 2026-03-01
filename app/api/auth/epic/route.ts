import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const epicId = searchParams.get("epicId");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/linked?error=Missing+code+or+state", request.url)
    );
  }

  try {
    const userId = state;
    
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/oauth/epic/callback?code=${code}&state=${userId}&epicId=${epicId || ''}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to link account');
    }

    return NextResponse.redirect(
      new URL("/linked?platform=epic", request.url)
    );
  } catch (error) {
    console.error("Epic OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/linked?error=Failed+to+link+account", request.url)
    );
  }
}
