import { createClient } from '@supabase/supabase-js';
import type { Channel, Video, SavedVideo } from './types';

// Use SUPABASE_URL or fallback to NEXT_PUBLIC_SUPABASE_URL for server-side
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY oder SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing Supabase server environment variables: ${missing.join(', ')}\n` +
    `Please create a .env.local file with these variables.\n` +
    `See .env.local.example for reference.`
  );
}

// Server-side client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type VideoWithChannel = Video & {
  channels: Channel | null;
};

// Typed database helpers
export const db = {
  // Channels
  async getChannels(activeOnly = false) {
    let query = supabaseAdmin.from('channels').select('*').order('created_at', { ascending: false });
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as Channel[];
  },

  async getChannelById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Channel;
  },

  async getChannelByChannelId(channelId: string) {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('channel_id', channelId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data as Channel | null;
  },

  async createChannel(channel: Omit<Channel, 'id' | 'created_at' | 'last_polled_at'>) {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .insert(channel)
      .select()
      .single();
    if (error) throw error;
    return data as Channel;
  },

  async updateChannel(id: string, updates: Partial<Channel>) {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Channel;
  },

  async updateChannelLastPolled(id: string) {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .update({ last_polled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Channel;
  },

  // Videos
  async getVideos(options: {
    hideShorts?: boolean;
    hideHidden?: boolean;
    limit?: number;
    perChannel?: number; // Anzahl Videos pro Kanal
  } = {}) {
    let query = supabaseAdmin
      .from('videos')
      .select(`
        *,
        channels (*)
      `)
      .order('published_at', { ascending: false });

    if (options.hideShorts) {
      query = query.eq('is_short', false);
    }
    if (options.hideHidden) {
      query = query.eq('is_hidden', false);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    let videos = data as VideoWithChannel[];
    
    // Wenn perChannel gesetzt ist, gruppiere und limitiere pro Kanal
    if (options.perChannel) {
      const videosByChannel = new Map<string, VideoWithChannel[]>();
      
      // Gruppiere nach channel_id
      for (const video of videos) {
        const channelId = video.channel_id || 'unknown';
        if (!videosByChannel.has(channelId)) {
          videosByChannel.set(channelId, []);
        }
        videosByChannel.get(channelId)!.push(video);
      }
      
      // Pro Kanal nur die ersten N Videos nehmen (bereits sortiert nach published_at DESC)
      videos = [];
      for (const channelVideos of videosByChannel.values()) {
        videos.push(...channelVideos.slice(0, options.perChannel));
      }
      
      // Sortiere wieder nach published_at für konsistente Reihenfolge
      videos.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }
    
    return videos;
  },

  async getVideoByYoutubeId(youtubeVideoId: string) {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        channels (*)
      `)
      .eq('youtube_video_id', youtubeVideoId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as VideoWithChannel | null;
  },

  async upsertVideo(video: Omit<Video, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .upsert(
        {
          ...video,
          // Use youtube_video_id as unique key for upsert
        },
        {
          onConflict: 'youtube_video_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();
    if (error) throw error;
    return data as Video;
  },

  async updateVideo(id: string, updates: Partial<Video>) {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Video;
  },

  async toggleVideoHidden(id: string) {
    const video = await this.getVideoById(id);
    return this.updateVideo(id, { is_hidden: !video.is_hidden });
  },

  async getVideoById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Video;
  },

  // Saved Videos
  async getSavedVideos() {
    const { data, error } = await supabaseAdmin
      .from('saved_videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as SavedVideo[];
  },

  async createSavedVideo(savedVideo: Omit<SavedVideo, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('saved_videos')
      .insert(savedVideo)
      .select()
      .single();
    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('Video already saved');
      }
      throw error;
    }
    return data as SavedVideo;
  },
};
