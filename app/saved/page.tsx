'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { extractVideoId } from '@/lib/youtube/parser';
import type { SavedVideo } from '@/lib/supabase/types';

export default function SavedPage() {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-videos');
      if (!response.ok) throw new Error('Failed to load saved videos');
      const data = await response.json();
      setSavedVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Videos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError('Ungültige YouTube URL');
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/saved-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_video_id: videoId,
          source_url: videoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add video');
      }

      setVideoUrl('');
      setIsDialogOpen(false);
      await loadSavedVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade gespeicherte Videos...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gespeicherte Videos</h1>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Video-Link hinzufügen
        </button>
      </div>
      {error && (
        <div className="mb-4 text-red-600">{error}</div>
      )}
      {savedVideos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine gespeicherten Videos. Fügen Sie einen Video-Link hinzu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-4 relative">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                  alt={video.title || 'Video'}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2">
                {video.title || 'Unbenanntes Video'}
              </h3>
              <Link
                href={`/watch/${video.youtube_video_id}`}
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Abspielen
              </Link>
            </div>
          ))}
        </div>
      )}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Video-Link hinzufügen</h2>
            <form onSubmit={handleAddVideo}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  YouTube URL
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                  disabled={adding}
                />
              </div>
              {error && (
                <div className="mb-4 text-red-600 text-sm">{error}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setVideoUrl('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabled={adding}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={adding}
                >
                  {adding ? 'Hinzufügen...' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
