'use client';

import { useState, useEffect, useRef } from 'react';
import { VideoCard } from '@/components/VideoCard';
import { ShortsToggle } from '@/components/ShortsToggle';
import type { VideoWithChannel } from '@/lib/supabase/types';

export default function FeedPage() {
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [hideShorts, setHideShorts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasPolledRef = useRef(false);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos?' + new URLSearchParams({
        hideShorts: hideShorts.toString(),
        hideHidden: 'true',
        perChannel: '3', // Server-seitig nur 3 Videos pro Kanal holen
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

  // Automatischer RSS-Poll beim ersten Laden der Seite
  useEffect(() => {
    const pollRSSFeeds = async () => {
      // Vermeide mehrfache Polls (z.B. bei schnellen Reloads)
      const lastPollTime = sessionStorage.getItem('rssLastPollTime');
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 Minuten in Millisekunden

      if (lastPollTime && (now - parseInt(lastPollTime)) < fiveMinutes) {
        // Poll wurde vor weniger als 5 Minuten durchgeführt, überspringe
        return;
      }

      if (hasPolledRef.current) {
        return;
      }
      hasPolledRef.current = true;

      try {
        // Poll im Hintergrund ausführen (nicht blockierend)
        const response = await fetch('/api/admin/poll-manual', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to poll RSS feeds');
        }

        // Poll erfolgreich, aktualisiere Zeitstempel
        sessionStorage.setItem('rssLastPollTime', now.toString());

        // Nach erfolgreichem Poll Videos neu laden
        await loadVideos();
      } catch (err) {
        // Fehlerbehandlung: Loggen aber nicht blockieren
        console.error('Error polling RSS feeds:', err);
        // Trotzdem Videos laden, falls bereits vorhanden
        await loadVideos();
      }
    };

    pollRSSFeeds();
  }, []); // Nur einmal beim Mount ausführen

  useEffect(() => {
    loadVideos();
  }, [hideShorts]);

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
    return <div className="text-center py-8 text-muted-foreground">Lade Videos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
  }

  // Gruppiere Videos nach Kanal und nehme pro Kanal max. 3 neueste Videos
  const videosByChannel = videos.reduce((acc, video) => {
    const channelId = video.channel_id || 'unknown';
    const channelName = video.channels?.title || video.channels?.channel_id || 'Unbekannter Kanal';
    
    if (!acc[channelId]) {
      acc[channelId] = {
        channel: video.channels,
        channelName,
        videos: [],
      };
    }
    acc[channelId].videos.push(video);
    return acc;
  }, {} as Record<string, { channel: VideoWithChannel['channels']; channelName: string; videos: VideoWithChannel[] }>);

  // Sortiere Videos pro Kanal nach published_at (neueste zuerst) und nehme max. 3
  Object.keys(videosByChannel).forEach((channelId) => {
    videosByChannel[channelId].videos.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
    videosByChannel[channelId].videos = videosByChannel[channelId].videos.slice(0, 3);
  });

  const channelGroups = Object.values(videosByChannel);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Video Feed</h1>
      <ShortsToggle hideShorts={hideShorts} onToggle={setHideShorts} />
      {channelGroups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Videos gefunden. Fügen Sie Kanäle hinzu oder importieren Sie welche.
        </div>
      ) : (
        <div className="space-y-8">
          {channelGroups.map((group, idx) => (
            <div key={group.channel?.id || `unknown-${idx}`} className="space-y-4">
              <h2 className="text-2xl font-semibold border-b border-border pb-2 text-foreground">
                {group.channelName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {group.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onToggleShort={handleToggleShort}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
