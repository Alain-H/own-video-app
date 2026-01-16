'use client';

import Link from 'next/link';

interface MoreVideosCardProps {
  channelId: string;
}

export function MoreVideosCard({ channelId }: MoreVideosCardProps) {
  return (
    <Link
      href={`/channels/${channelId}`}
      className="bg-card text-card-foreground rounded-lg shadow-modern overflow-hidden hover:shadow-modern-lg transition-all duration-300 border border-border flex flex-col"
    >
      {/* Placeholder area instead of video thumbnail - empty or with icon */}
      <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
        <svg
          className="w-12 h-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
      <div className="p-4 flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2 text-foreground">
            Mehr Videos
          </h3>
          <p className="text-sm text-muted-foreground">Alle Videos anzeigen</p>
        </div>
      </div>
    </Link>
  );
}
