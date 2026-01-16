'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';
import type { VideoWithChannel } from '@/lib/supabase/types';

interface VideoCardProps {
  video: VideoWithChannel;
  onToggleShort?: (videoId: string) => void;
}

export function VideoCard({ video, onToggleShort }: VideoCardProps) {
  const channel = video.channels;
  const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-modern overflow-hidden hover:shadow-modern-lg transition-all duration-300 border border-border">
      <Link href={`/watch/${video.youtube_video_id}`}>
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {video.is_short && (
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md z-10">
              SHORTS
            </div>
          )}
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/watch/${video.youtube_video_id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors text-foreground">
            {video.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {channel && (
              <span className="font-medium text-foreground">{channel.title || channel.channel_id}</span>
            )}
            <span className="mx-2">•</span>
            <span>{formatRelativeTime(video.published_at)}</span>
          </div>
        </div>
        {onToggleShort && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleShort(video.id);
            }}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {video.is_short ? 'Short-Markierung entfernen' : 'Als Short markieren'}
          </button>
        )}
      </div>
    </div>
  );
}
