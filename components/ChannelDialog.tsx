'use client';

import { useState } from 'react';
import { buildRssUrl, isValidChannelId } from '@/lib/youtube/parser';
import { z } from 'zod';

const channelSchema = z.object({
  input: z.string().min(1, 'Bitte geben Sie eine Channel ID oder RSS URL ein'),
});

interface ChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (channelId: string, rssUrl: string, title?: string) => Promise<void>;
}

export function ChannelDialog({ isOpen, onClose, onAdd }: ChannelDialogProps) {
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate input
      channelSchema.parse({ input });

      let channelId: string;
      let rssUrl: string;

      // Check if input is a valid channel ID
      if (isValidChannelId(input.trim())) {
        channelId = input.trim();
        rssUrl = buildRssUrl(channelId);
      } else if (input.trim().startsWith('http')) {
        // Assume it's an RSS URL
        rssUrl = input.trim();
        // Try to extract channel ID from URL
        const match = rssUrl.match(/channel_id=([a-zA-Z0-9_-]+)/);
        channelId = match ? match[1] : rssUrl; // Fallback to URL as ID
      } else {
        throw new Error('Ungültige Channel ID oder RSS URL');
      }

      setLoading(true);
      await onAdd(channelId, rssUrl, title.trim() || undefined);
      setInput('');
      setTitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Kanals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Kanal hinzufügen</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Channel ID (UC...) oder RSS URL
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="UCxxxx... oder https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Titel (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kanalname"
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Hinzufügen...' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
