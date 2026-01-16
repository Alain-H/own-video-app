'use client';

import { useState, useEffect } from 'react';
import { ChannelDialog } from '@/components/ChannelDialog';
import type { Channel } from '@/lib/supabase/types';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
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

  const handleEditChannel = async (id: string, channelId: string, rssUrl: string, title?: string) => {
    try {
      const response = await fetch(`/api/channels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, rss_url: rssUrl, title }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update channel');
      }
      await loadChannels();
    } catch (err) {
      throw err;
    }
  };

  const handleOpenEditDialog = (channel: Channel) => {
    setEditingChannel(channel);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingChannel(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Lade Kanäle...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Kanäle</h1>
        <button
          onClick={() => {
            setEditingChannel(null);
            setIsDialogOpen(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
        >
          Kanal hinzufügen
        </button>
      </div>
      {error && (
        <div className="mb-4 text-destructive">{error}</div>
      )}
      {channels.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Kanäle vorhanden. Fügen Sie einen Kanal hinzu.
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-card text-card-foreground rounded-lg shadow-modern p-4 flex items-center justify-between border border-border"
            >
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {channel.title || channel.channel_id}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {channel.channel_id}
                </p>
                {channel.last_polled_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Zuletzt aktualisiert: {new Date(channel.last_polled_at).toLocaleString('de-DE')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    channel.is_active
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {channel.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => handleOpenEditDialog(channel)}
                  className="px-4 py-2 border border-border rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleToggleActive(channel.id, channel.is_active)}
                  className="px-4 py-2 border border-border rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
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
        onClose={handleCloseDialog}
        mode={editingChannel ? 'edit' : 'add'}
        channel={editingChannel || undefined}
        onAdd={handleAddChannel}
        onEdit={handleEditChannel}
      />
    </div>
  );
}
