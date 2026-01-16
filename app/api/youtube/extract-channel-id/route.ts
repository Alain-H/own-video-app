import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts YouTube Channel ID from various URL formats including @handle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // Extract handle from @handle URL (e.g., https://www.youtube.com/@playpathofexile)
    const handleMatch = trimmedUrl.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];
      
      try {
        // Fetch the channel page and extract channel ID from meta tags or structured data
        const response = await fetch(trimmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch channel page: ${response.status}`);
        }

        const html = await response.text();
        
        // Try multiple methods to extract channel ID
        
        // Method 1: Look for channelId in meta tags
        const metaChannelIdMatch = html.match(/"channelId"\s*:\s*"([^"]+)"/);
        if (metaChannelIdMatch) {
          return NextResponse.json({
            channelId: metaChannelIdMatch[1],
            rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${metaChannelIdMatch[1]}`,
          });
        }

        // Method 2: Look for externalId in structured data
        const externalIdMatch = html.match(/"externalId"\s*:\s*"([^"]+)"/);
        if (externalIdMatch) {
          return NextResponse.json({
            channelId: externalIdMatch[1],
            rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${externalIdMatch[1]}`,
          });
        }

        // Method 3: Look for browse_id (sometimes used in YouTube's internal data)
        const browseIdMatch = html.match(/"browseId"\s*:\s*"([^"]+)"/);
        if (browseIdMatch && browseIdMatch[1].startsWith('UC')) {
          return NextResponse.json({
            channelId: browseIdMatch[1],
            rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${browseIdMatch[1]}`,
          });
        }

        // Method 4: Look for canonical URL with channel ID
        const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/channel\/([^"]+)"/);
        if (canonicalMatch) {
          return NextResponse.json({
            channelId: canonicalMatch[1],
            rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${canonicalMatch[1]}`,
          });
        }

        // Method 5: Look for channel ID in JSON-LD structured data
        const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
        if (jsonLdMatch) {
          try {
            const jsonLd = JSON.parse(jsonLdMatch[1]);
            if (jsonLd?.identifier?.value?.startsWith('UC')) {
              return NextResponse.json({
                channelId: jsonLd.identifier.value,
                rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${jsonLd.identifier.value}`,
              });
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        throw new Error('Could not extract channel ID from page');
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Failed to extract channel ID',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // If it's already a channel URL with ID
    const channelIdMatch = trimmedUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelIdMatch) {
      const channelId = channelIdMatch[1];
      return NextResponse.json({
        channelId,
        rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      });
    }

    // If it's already an RSS URL
    const rssChannelIdMatch = trimmedUrl.match(/channel_id=([a-zA-Z0-9_-]+)/);
    if (rssChannelIdMatch) {
      const channelId = rssChannelIdMatch[1];
      return NextResponse.json({
        channelId,
        rssUrl: trimmedUrl,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported URL format. Please use a YouTube channel URL (e.g., https://www.youtube.com/@username)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error extracting channel ID:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
