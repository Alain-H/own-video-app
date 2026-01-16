'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { VideoCard } from '@/components/VideoCard';
import { ShortsToggle } from '@/components/ShortsToggle';
import type { VideoWithChannel } from '@/lib/supabase/types';

export default function ChannelDetailPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [hideShorts, setHideShorts] = useState(true); // Standardmäßig Shorts ausblenden
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [channelName, setChannelName] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);

  const loadVideos = async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      const response = await fetch('/api/videos?' + new URLSearchParams({
        hideShorts: hideShorts.toString(),
        hideHidden: 'true',
        channelId: channelId,
        limit: '30',
        offset: offset.toString(),
      }));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load videos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Videos geladen: ${data.length} Videos gefunden (Offset: ${offset}, Limit: 30, hideShorts: ${hideShorts})`);
      if (data.length < 30) {
        if (hideShorts) {
          console.log(`Nur ${data.length} Videos ohne Shorts gefunden. Es gibt nicht genug Videos ohne Shorts in der Datenbank.`);
        } else {
          console.log(`Weniger als 30 Videos zurückgegeben. Keine weiteren Videos vorhanden.`);
        }
      }
      
      if (append) {
        setVideos(prev => [...prev, ...data]);
      } else {
        setVideos(data);
      }
      
      // Prüfe ob weitere Videos verfügbar sind
      setHasMore(data.length === 30);
      
      // Setze Kanalname aus dem ersten Video
      if (data.length > 0 && data[0].channels && !channelName) {
        setChannelName(data[0].channels.title || data[0].channels.channel_id || 'Unbekannter Kanal');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Videos';
      console.error('Fehler beim Laden der Videos:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadVideos(videos.length, true);
    }
  };

  useEffect(() => {
    if (channelId) {
      setVideos([]); // Reset videos when channelId or hideShorts changes
      loadVideos(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, hideShorts]);

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
    return (
      <div>
        <Link href="/feed" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Zurück zum Feed
        </Link>
        <div className="text-center py-8 text-muted-foreground">Lade Videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link href="/feed" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Zurück zum Feed
        </Link>
        <div className="text-center py-8 text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/feed" className="text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← Zurück zum Feed
      </Link>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {channelName || 'Kanal Videos'}
          </h1>
          <p className="text-muted-foreground">
            {videos.length} {videos.length === 1 ? 'Video' : 'Videos'} geladen
            {hideShorts && ' (ohne Shorts)'}
          </p>
        </div>
        <ShortsToggle hideShorts={hideShorts} onToggle={setHideShorts} />
      </div>

      {videos.length === 0 && !loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Videos gefunden für diesen Kanal.
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
          {hasMore && (
            <div className="bg-card text-card-foreground rounded-lg shadow-modern overflow-hidden hover:shadow-modern-lg transition-all duration-300 border border-border">
              <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loadingMore ? 'Lade...' : 'Weitere Videos laden (30)'}
                </button>
              </div>
              <div className="p-4">
                <div className="h-4"></div>
                <div className="h-4"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
