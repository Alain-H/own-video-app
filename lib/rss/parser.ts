import { XMLParser } from 'fast-xml-parser';
import { isShort } from '../youtube/parser';

export interface RSSEntry {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  author: string;
  thumbnailUrl: string | null;
}

/**
 * Fetches and parses YouTube RSS feed
 */
export async function parseRSSFeed(rssUrl: string): Promise<RSSEntry[]> {
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseRSSXML(xmlText);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
}

/**
 * Parses RSS XML string and extracts video entries
 */
export function parseRSSXML(xmlText: string): RSSEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xmlText);
  const entries: RSSEntry[] = [];

  // YouTube RSS structure: feed.entry[]
  const feed = parsed.feed;
  if (!feed || !feed.entry) {
    return entries;
  }

  // Handle single entry or array
  const entryArray = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

  for (const entry of entryArray) {
    try {
      // Extract video ID from yt:videoId or from link
      let videoId = entry['yt:videoId'] || entry['yt:videoId']?.['#text'];
      
      // Fallback: extract from link
      if (!videoId && entry.link) {
        const linkHref = Array.isArray(entry.link) 
          ? entry.link[0]?.['@_href'] 
          : entry.link['@_href'];
        if (linkHref) {
          const match = linkHref.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
          if (match) videoId = match[1];
        }
      }

      if (!videoId) continue;

      // Extract title
      const title = entry.title?.['#text'] || entry.title || 'Untitled';

      // Extract link
      const link = Array.isArray(entry.link) 
        ? entry.link[0]?.['@_href'] 
        : entry.link?.['@_href'];
      if (!link) continue;

      // Extract published date
      const published = entry.published?.['#text'] || entry.published || entry.updated?.['#text'] || entry.updated;
      if (!published) continue;

      // Extract author
      const author = entry.author?.name?.['#text'] || entry.author?.name || entry['yt:channelName']?.['#text'] || entry['yt:channelName'] || 'Unknown';

      // Extract thumbnail
      let thumbnailUrl: string | null = null;
      if (entry['media:group']?.['media:thumbnail']) {
        const thumbnails = Array.isArray(entry['media:group']['media:thumbnail'])
          ? entry['media:group']['media:thumbnail']
          : [entry['media:group']['media:thumbnail']];
        if (thumbnails.length > 0) {
          thumbnailUrl = thumbnails[0]?.['@_url'] || thumbnails[0]?.['url'] || null;
        }
      }

      entries.push({
        videoId,
        title,
        url: link,
        publishedAt: published,
        author,
        thumbnailUrl,
      });
    } catch (error) {
      console.error('Error parsing RSS entry:', error);
      continue;
    }
  }

  return entries;
}

/**
 * Determines if a video is a short based on RSS data
 */
export function detectShortFromRSS(entry: RSSEntry): boolean {
  return isShort(entry.url, entry.title);
}
