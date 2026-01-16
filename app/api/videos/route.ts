import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hideShorts = searchParams.get('hideShorts') === 'true';
    const hideHidden = searchParams.get('hideHidden') === 'true';
    const perChannel = searchParams.get('perChannel');
    const perChannelLimit = perChannel ? parseInt(perChannel, 10) : undefined;
    const channelId = searchParams.get('channelId') || undefined;
    const offset = searchParams.get('offset');
    const offsetValue = offset ? parseInt(offset, 10) : undefined;
    const limit = searchParams.get('limit');
    const limitValue = limit ? parseInt(limit, 10) : undefined;

    const videos = await db.getVideos({
      hideShorts,
      hideHidden,
      perChannel: perChannelLimit,
      channelId,
      offset: offsetValue,
      limit: limitValue,
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
