import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { event, clipId, status } = body;

    console.log('Allstar webhook received:', { event, clipId, status });

    if (event === 'clip.ready' && clipId) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      
      await fetch(`${backendUrl}/webhooks/allstar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event, clipId, status }),
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
