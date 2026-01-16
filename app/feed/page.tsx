'use client';

import { useState, useEffect } from 'react';
import { VideoCard } from '@/components/VideoCard';
import { ShortsToggle } from '@/components/ShortsToggle';
import { db } from '@/lib/supabase/server';
import type { VideoWithChannel } from '@/lib/supabase/types';

export default function FeedPage() {
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [hideShorts, setHideShorts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVideos();
  }, [hideShorts]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos?' + new URLSearchParams({
        hideShorts: hideShorts.toString(),
        hideHidden: 'true',
      }));
      if (!response.ok) throw new Error('Failed to load videos');
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Videos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShort = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/toggle-short`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle short');
      await loadVideos();
    } catch (err) {
      console.error('Error toggling short:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Videos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Video Feed</h1>
      <ShortsToggle hideShorts={hideShorts} onToggle={setHideShorts} />
      {videos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Videos gefunden. Fügen Sie Kanäle hinzu oder importieren Sie welche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onToggleShort={handleToggleShort}
            />
          ))}
        </div>
      )}
    </div>
  );
}
