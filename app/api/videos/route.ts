import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hideShorts = searchParams.get('hideShorts') === 'true';
    const hideHidden = searchParams.get('hideHidden') === 'true';

    const videos = await db.getVideos({
      hideShorts,
      hideHidden,
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
