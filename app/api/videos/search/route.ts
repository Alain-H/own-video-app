import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Get all videos for search (no limit, we'll filter in memory)
    // Note: For better performance with large datasets, consider server-side filtering
    const allVideos = await db.getVideos({
      hideHidden: true,
      // No limit - we want to search all available videos
      limit: undefined,
    });

    // Simple text search (case-insensitive)
    const searchTerm = query.toLowerCase().trim();
    const filteredVideos = allVideos.filter((video) => {
      const titleMatch = video.title.toLowerCase().includes(searchTerm);
      const channelMatch = video.channels?.title?.toLowerCase().includes(searchTerm) || 
                          video.channels?.channel_id?.toLowerCase().includes(searchTerm);
      return titleMatch || channelMatch;
    });

    // Limit to top 20 results
    return NextResponse.json(filteredVideos.slice(0, 20));
  } catch (error) {
    console.error('Error searching videos:', error);
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    );
  }
}
