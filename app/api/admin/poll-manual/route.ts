import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { parseRSSFeed, detectShortFromRSS } from '@/lib/rss/parser';
import { isValidRssUrl, fixRssUrl } from '@/lib/youtube/parser';

// This endpoint is for manual triggering from the admin UI
// It doesn't require a token since it's called from the same app
// In production, you might want to add additional security
export async function POST() {
  try {
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
        // Validate and potentially fix RSS URL
        let rssUrl = channel.rss_url;
        if (!isValidRssUrl(rssUrl)) {
          const fixedUrl = fixRssUrl(rssUrl);
          if (fixedUrl) {
            console.warn(`RSS URL für Channel ${channel.channel_id} korrigiert: ${rssUrl} -> ${fixedUrl}`);
            rssUrl = fixedUrl;
          } else {
            const errorMsg = `Ungültige RSS-URL für Channel ${channel.channel_id}: ${rssUrl}. @handle URLs können nicht automatisch konvertiert werden - bitte Channel-ID verwenden oder Channel bearbeiten.`;
            results.errors.push(errorMsg);
            console.warn(`Channel ${channel.channel_id} übersprungen: ${errorMsg}`);
            continue; // Skip this channel
          }
        }

        // Fetch and parse RSS feed
        let entries;
        try {
          entries = await parseRSSFeed(rssUrl);
          console.log(`[RSS Poll] Channel ${channel.channel_id}: ${entries.length} Videos im RSS-Feed gefunden`);
        } catch (feedError) {
          // RSS Feed konnte nicht geladen werden (z.B. 404, Netzwerkfehler)
          const errorMsg = `RSS Feed konnte nicht geladen werden für Channel ${channel.channel_id} (${rssUrl}): ${feedError instanceof Error ? feedError.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.warn(`Channel ${channel.channel_id} übersprungen: ${errorMsg}`);
          continue; // Skip this channel
        }

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
