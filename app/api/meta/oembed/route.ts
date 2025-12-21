import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Meta oEmbed API for Instagram
    // You can use either:
    // 1. User access token from Instagram Basic Display API
    // 2. App access token in format: APP_ID|APP_SECRET
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Meta API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('oEmbed API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch from Meta API',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}