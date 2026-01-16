'use client';

import { useState, useEffect } from 'react';
import { buildRssUrl, isValidChannelId, isValidRssUrl } from '@/lib/youtube/parser';
import { z } from 'zod';
import type { Channel } from '@/lib/supabase/types';

const channelSchema = z.object({
  input: z.string().min(1, 'Bitte geben Sie eine Channel ID oder RSS URL ein'),
});

interface ChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  channel?: Channel;
  onAdd: (channelId: string, rssUrl: string, title?: string) => Promise<void>;
  onEdit?: (id: string, channelId: string, rssUrl: string, title?: string) => Promise<void>;
}

export function ChannelDialog({ isOpen, onClose, mode = 'add', channel, onAdd, onEdit }: ChannelDialogProps) {
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Felder vorausfüllen wenn im Edit-Modus
  useEffect(() => {
    if (mode === 'edit' && channel) {
      setInput(channel.channel_id);
      setTitle(channel.title || '');
    } else {
      setInput('');
      setTitle('');
    }
  }, [mode, channel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate input
      channelSchema.parse({ input });

      let channelId: string;
      let rssUrl: string;

      const trimmedInput = input.trim();

      // Check if input is a valid channel ID
      if (isValidChannelId(trimmedInput)) {
        channelId = trimmedInput;
        rssUrl = buildRssUrl(channelId);
      } else if (trimmedInput.startsWith('http')) {
        // Check if it's a YouTube @handle URL or channel URL
        if (trimmedInput.includes('youtube.com') && (trimmedInput.includes('@') || trimmedInput.includes('/channel/'))) {
          // Extract channel ID from YouTube URL (including @handle)
          setLoading(true);
          const response = await fetch('/api/youtube/extract-channel-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trimmedInput }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Konnte Channel-ID nicht extrahieren');
          }

          const data = await response.json();
          channelId = data.channelId;
          rssUrl = data.rssUrl;
        } else if (isValidRssUrl(trimmedInput)) {
          // It's already a valid RSS URL
          rssUrl = trimmedInput;
          // Try to extract channel ID from RSS URL
          const match = rssUrl.match(/channel_id=([a-zA-Z0-9_-]+)/);
          channelId = match ? match[1] : rssUrl; // Fallback to URL as ID
        } else {
          // Try to extract channel ID from URL or treat as RSS URL
          const match = trimmedInput.match(/channel_id=([a-zA-Z0-9_-]+)/);
          if (match) {
            channelId = match[1];
            rssUrl = buildRssUrl(channelId);
          } else {
            throw new Error('Ungültige URL. Bitte geben Sie eine YouTube Channel-URL (z.B. https://www.youtube.com/@username) oder eine RSS-URL ein.');
          }
        }
      } else {
        throw new Error('Ungültige Eingabe. Bitte geben Sie eine Channel-ID (UC...), eine YouTube Channel-URL oder eine RSS-URL ein.');
      }

      // setLoading is already set above for YouTube URL extraction, or we need to set it here for other cases
      if (!trimmedInput.includes('youtube.com') || (!trimmedInput.includes('@') && !trimmedInput.includes('/channel/'))) {
        setLoading(true);
      }
      
      if (mode === 'edit' && channel && onEdit) {
        await onEdit(channel.id, channelId, rssUrl, title.trim() || undefined);
      } else {
        await onAdd(channelId, rssUrl, title.trim() || undefined);
      }
      
      setInput('');
      setTitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'edit' ? 'Fehler beim Aktualisieren des Kanals' : 'Fehler beim Hinzufügen des Kanals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[var(--z-dialog-overlay)]">
      <div className="bg-card text-card-foreground rounded-lg p-6 w-full max-w-md shadow-modern-lg border border-border glass-effect z-[var(--z-dialog-content)]">
        <h2 className="text-xl font-bold mb-4 text-foreground">{mode === 'edit' ? 'Kanal bearbeiten' : 'Kanal hinzufügen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              YouTube Channel URL, Channel ID (UC...) oder RSS URL
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://www.youtube.com/@username oder UCxxxx... oder RSS-URL"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unterstützte Formate: @handle URLs, Channel-URLs, Channel-IDs oder RSS-URLs
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Titel (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kanalname"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="mb-4 text-destructive text-sm">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              disabled={loading}
            >
              {loading ? (mode === 'edit' ? 'Speichern...' : 'Hinzufügen...') : (mode === 'edit' ? 'Speichern' : 'Hinzufügen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
