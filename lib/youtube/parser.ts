/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace
  url = url.trim();

  // Patterns to match:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  // https://youtube.com/watch?v=VIDEO_ID
  // http://www.youtube.com/watch?v=VIDEO_ID

  // Match youtu.be format
  const youtuBeMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) return youtuBeMatch[1];

  // Match /shorts/ format
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Match watch?v= format
  const watchMatch = url.match(/(?:watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Match embed format
  const embedMatch = url.match(/(?:embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // If it's already just an ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

/**
 * Checks if a URL or title indicates a Short
 */
export function isShort(url: string, title?: string): boolean {
  // Check URL for /shorts/ pattern
  if (url.includes('/shorts/')) return true;

  // Check title for #shorts or shorts (case-insensitive)
  if (title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('#shorts') || lowerTitle.includes('shorts')) {
      return true;
    }
  }

  return false;
}

/**
 * Builds YouTube RSS URL from channel ID
 */
export function buildRssUrl(channelId: string): string {
  // Remove any whitespace or URL parts
  const cleanId = channelId.trim().replace(/^.*channel_id=/, '');
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`;
}

/**
 * Validates if a string looks like a YouTube channel ID (starts with UC)
 */
export function isValidChannelId(channelId: string): boolean {
  return /^UC[a-zA-Z0-9_-]{22}$/.test(channelId.trim());
}

/**
 * Checks if a URL is a valid YouTube RSS feed URL
 */
export function isValidRssUrl(url: string): boolean {
  return url.includes('/feeds/videos.xml') || url.includes('/feeds/videos.xml?');
}

/**
 * Attempts to fix or convert a YouTube URL to a valid RSS URL
 * Note: For @handle URLs, this cannot be automatically converted without the Channel ID
 */
export function fixRssUrl(url: string): string | null {
  const trimmed = url.trim();
  
  // Already a valid RSS URL
  if (isValidRssUrl(trimmed)) {
    return trimmed;
  }
  
  // Try to extract channel_id from existing URL
  const channelIdMatch = trimmed.match(/[?&]channel_id=([a-zA-Z0-9_-]{24})/);
  if (channelIdMatch) {
    return buildRssUrl(channelIdMatch[1]);
  }
  
  // If it's a @handle URL, we can't automatically convert it
  if (trimmed.includes('@') && trimmed.includes('youtube.com')) {
    return null; // Cannot convert @handle to RSS without Channel ID
  }
  
  // If it's a valid channel ID, build RSS URL
  if (isValidChannelId(trimmed)) {
    return buildRssUrl(trimmed);
  }
  
  return null;
}
