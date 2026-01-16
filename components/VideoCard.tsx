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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/watch/${video.youtube_video_id}`}>
        <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700">
          {video.is_short && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SHORTS
            </div>
          )}
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/watch/${video.youtube_video_id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
            {video.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {channel && (
              <span className="font-medium">{channel.title || channel.channel_id}</span>
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
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {video.is_short ? 'Short-Markierung entfernen' : 'Als Short markieren'}
          </button>
        )}
      </div>
    </div>
  );
}
