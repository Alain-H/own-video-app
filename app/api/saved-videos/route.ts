import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { extractVideoId } from '@/lib/youtube/parser';

export async function GET() {
  try {
    const savedVideos = await db.getSavedVideos();
    return NextResponse.json(savedVideos);
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_video_id, source_url, title } = body;

    if (!youtube_video_id || !source_url) {
      return NextResponse.json(
        { error: 'youtube_video_id and source_url are required' },
        { status: 400 }
      );
    }

    const savedVideo = await db.createSavedVideo({
      youtube_video_id,
      source_url,
      title: title || null,
    });

    return NextResponse.json(savedVideo, { status: 201 });
  } catch (error) {
    console.error('Error creating saved video:', error);
    if (error instanceof Error && error.message === 'Video already saved') {
      return NextResponse.json(
        { error: 'Video already saved' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create saved video' },
      { status: 500 }
    );
  }
}
