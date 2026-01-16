// Database types for Supabase tables
// These are fallback types - ideally generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export type Channel = {
  id: string;
  channel_id: string;
  title: string | null;
  rss_url: string;
  is_active: boolean;
  created_at: string;
  last_polled_at: string | null;
};

export type Video = {
  id: string;
  youtube_video_id: string;
  channel_id: string | null;
  title: string;
  url: string;
  published_at: string;
  thumbnail_url: string | null;
  is_hidden: boolean;
  is_short: boolean;
  created_at: string;
};

export type SavedVideo = {
  id: string;
  youtube_video_id: string;
  source_url: string;
  title: string | null;
  created_at: string;
};

export type VideoWithChannel = Video & {
  channels: Channel | null;
};
