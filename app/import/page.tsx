'use client';

import { useState } from 'react';
import { ImportDialog } from '@/components/ImportDialog';
import { buildRssUrl, isValidChannelId } from '@/lib/youtube/parser';

export default function ImportPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImport = async (
    channels: Array<{ channelId: string; rssUrl: string; title?: string }>
  ) => {
    setImporting(true);
    setError('');
    setSuccess('');

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const channel of channels) {
        try {
          // Ensure we have a valid RSS URL
          let rssUrl = channel.rssUrl;
          if (!rssUrl.startsWith('http')) {
            // If channelId looks valid, build RSS URL
            if (isValidChannelId(channel.channelId)) {
              rssUrl = buildRssUrl(channel.channelId);
            } else {
              errorCount++;
              continue;
            }
          }

          const response = await fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel_id: channel.channelId,
              rss_url: rssUrl,
              title: channel.title,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            // Check if it's a duplicate error
            if (response.status !== 409) {
              errorCount++;
            } else {
              // Duplicate, count as success (already exists)
              successCount++;
            }
          }
        } catch (err) {
          errorCount++;
          console.error('Error importing channel:', err);
        }
      }

      if (errorCount === 0) {
        setSuccess(`Alle ${successCount} Kanäle erfolgreich importiert.`);
      } else {
        setSuccess(`${successCount} Kanäle importiert, ${errorCount} Fehler.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Importieren');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kanäle importieren</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Importieren Sie mehrere Kanäle auf einmal aus einer Datei. Die App unterstützt JSON, CSV oder TXT Dateien.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            <strong>Tipp:</strong> Sie können Ihre YouTube Subscriptions über Google Takeout exportieren. 
            Das Format kann variieren, daher versucht die App automatisch Channel IDs oder RSS URLs zu erkennen.
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={importing}
        >
          Datei hochladen
        </button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
          {success}
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Unterstützte Formate</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">JSON Format:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`[
  "UCxxxx...",
  { "channel_id": "UCxxxx...", "title": "Kanal Name" },
  { "rss_url": "https://..." }
]`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">CSV Format:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`UCxxxx...,Kanal Name
UCyyyy...,Anderer Kanal`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">TXT Format (eine pro Zeile):</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
{`UCxxxx...
UCyyyy...
https://www.youtube.com/feeds/videos.xml?channel_id=UCzzzz...`}
            </pre>
          </div>
        </div>
      </div>
      <ImportDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setError('');
          setSuccess('');
        }}
        onImport={handleImport}
      />
    </div>
  );
}
