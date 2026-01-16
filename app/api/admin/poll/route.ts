import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { parseRSSFeed, detectShortFromRSS } from '@/lib/rss/parser';

export async function POST(request: NextRequest) {
  try {
    // Check admin token
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token not configured' },
        { status: 500 }
      );
    }

    if (token !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active channels
    const channels = await db.getChannels(true);

    const results = {
      channelsProcessed: 0,
      videosAdded: 0,
      videosUpdated: 0,
      errors: [] as string[],
    };

    for (const channel of channels) {
      try {
        // Fetch and parse RSS feed
        const entries = await parseRSSFeed(channel.rss_url);

        for (const entry of entries) {
          try {
            // Check if video already exists
            const existingVideo = await db.getVideoByYoutubeId(entry.videoId);

            // Determine if it's a short
            const isShort = detectShortFromRSS(entry);

            const videoData = {
              youtube_video_id: entry.videoId,
              channel_id: channel.id,
              title: entry.title,
              url: entry.url,
              published_at: entry.publishedAt,
              thumbnail_url: entry.thumbnailUrl,
              is_short: isShort,
              is_hidden: false,
            };

            if (existingVideo) {
              // Update existing video (but preserve is_hidden if manually set)
              await db.upsertVideo({
                ...videoData,
                is_hidden: existingVideo.is_hidden, // Preserve manual hide state
              });
              results.videosUpdated++;
            } else {
              // Insert new video
              await db.upsertVideo(videoData);
              results.videosAdded++;
            }
          } catch (error) {
            const errorMsg = `Error processing video ${entry.videoId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.errors.push(errorMsg);
            console.error(errorMsg, error);
          }
        }

        // Update last_polled_at
        await db.updateChannelLastPolled(channel.id);
        results.channelsProcessed++;
      } catch (error) {
        const errorMsg = `Error processing channel ${channel.channel_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
