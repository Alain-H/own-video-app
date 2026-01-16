'use client';

import { useState } from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (channels: Array<{ channelId: string; rssUrl: string; title?: string }>) => Promise<void>;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<{ channelId: string; rssUrl: string; title?: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const parseFile = async (file: File) => {
    const text = await file.text();
    const channels: Array<{ channelId: string; rssUrl: string; title?: string }> = [];

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        for (const item of json) {
          if (typeof item === 'string') {
            // Just a string, try to extract channel ID or use as RSS URL
            const channelId = extractChannelId(item);
            if (channelId) {
              channels.push({
                channelId,
                rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
              });
            } else if (item.startsWith('http')) {
              channels.push({
                channelId: item,
                rssUrl: item,
              });
            }
          } else if (item.channel_id || item.channelId || item.rss_url || item.rssUrl) {
            const channelId = item.channel_id || item.channelId || '';
            const rssUrl = item.rss_url || item.rssUrl || `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            channels.push({
              channelId: channelId || rssUrl,
              rssUrl,
              title: item.title || item.name,
            });
          }
        }
      }
    } catch {
      // Not JSON, try CSV or line-separated
      const lines = text.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // Try CSV format: channel_id,title or just channel_id
        const parts = line.split(',').map(p => p.trim());
        if (parts[0]) {
          const channelId = extractChannelId(parts[0]);
          if (channelId) {
            channels.push({
              channelId,
              rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
              title: parts[1],
            });
          } else if (parts[0].startsWith('http')) {
            channels.push({
              channelId: parts[0],
              rssUrl: parts[0],
              title: parts[1],
            });
          }
        }
      }
    }

    return channels;
  };

  const extractChannelId = (text: string): string | null => {
    // Match UC... pattern
    const match = text.match(/UC[a-zA-Z0-9_-]{22}/);
    return match ? match[0] : null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    try {
      const parsed = await parseFile(selectedFile);
      if (parsed.length === 0) {
        setError('Keine Channel IDs oder RSS URLs gefunden');
      } else {
        setPreview(parsed);
      }
    } catch (err) {
      setError('Fehler beim Parsen der Datei');
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setLoading(true);
    try {
      await onImport(preview);
      setFile(null);
      setPreview([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Importieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kanäle importieren</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Laden Sie eine Datei hoch (JSON, CSV oder TXT). Die App versucht automatisch Channel IDs oder RSS URLs zu erkennen.
        </p>
        <div className="mb-4">
          <input
            type="file"
            accept=".json,.csv,.txt"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Gefundene Kanäle ({preview.length}):</h3>
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2">
              {preview.map((channel, idx) => (
                <div key={idx} className="text-sm py-1">
                  {channel.title && <span className="font-medium">{channel.title} - </span>}
                  <span className="text-gray-600 dark:text-gray-400">{channel.channelId}</span>
                </div>
              ))}
            </div>
          </div>
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
            type="button"
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || preview.length === 0}
          >
            {loading ? 'Importieren...' : 'Importieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
