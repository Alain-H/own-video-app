import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';

export async function GET() {
  try {
    const channels = await db.getChannels();
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_id, rss_url, title } = body;

    if (!channel_id || !rss_url) {
      return NextResponse.json(
        { error: 'channel_id and rss_url are required' },
        { status: 400 }
      );
    }

    // Check if channel already exists
    const existing = await db.getChannelByChannelId(channel_id);
    if (existing) {
      return NextResponse.json(
        { error: 'Channel already exists' },
        { status: 409 }
      );
    }

    const channel = await db.createChannel({
      channel_id,
      rss_url,
      title: title || null,
      is_active: true,
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
