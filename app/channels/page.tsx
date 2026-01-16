'use client';

import { useState, useEffect } from 'react';
import { ChannelDialog } from '@/components/ChannelDialog';
import type { Channel } from '@/lib/supabase/types';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/channels');
      if (!response.ok) throw new Error('Failed to load channels');
      const data = await response.json();
      setChannels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kanäle');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (channelId: string, rssUrl: string, title?: string) => {
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, rss_url: rssUrl, title }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add channel');
      }
      await loadChannels();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleActive = async (channelId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      });
      if (!response.ok) throw new Error('Failed to update channel');
      await loadChannels();
    } catch (err) {
      console.error('Error toggling channel:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Kanäle...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kanäle</h1>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Kanal hinzufügen
        </button>
      </div>
      {error && (
        <div className="mb-4 text-red-600">{error}</div>
      )}
      {channels.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Kanäle vorhanden. Fügen Sie einen Kanal hinzu.
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-lg">
                  {channel.title || channel.channel_id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {channel.channel_id}
                </p>
                {channel.last_polled_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Zuletzt aktualisiert: {new Date(channel.last_polled_at).toLocaleString('de-DE')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    channel.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {channel.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => handleToggleActive(channel.id, channel.is_active)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {channel.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ChannelDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddChannel}
      />
    </div>
  );
}
