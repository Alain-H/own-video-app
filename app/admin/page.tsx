'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const githubActionsYml = [
    '.github/workflows/poll-rss.yml',
    'name: Poll RSS Feeds',
    'on:',
    '  schedule:',
    "    - cron: '*/30 * * * *'  # Alle 30 Minuten",
    'jobs:',
    '  poll:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - name: Poll RSS',
    '        run: |',
    '          curl -X POST "${{ secrets.APP_URL }}/api/admin/poll?token=${{ secrets.ADMIN_TOKEN }}"',
  ].join('\n');

  const handlePoll = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Get admin token from environment (in production, this should be handled server-side)
      // For now, we'll use a client-side approach - in production, create a server action
      const response = await fetch('/api/admin/poll-manual', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to poll');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">RSS Updates</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aktualisieren Sie alle aktiven Kanäle manuell. Die App holt die neuesten Videos von den RSS Feeds.
        </p>
        <button
          onClick={handlePoll}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Aktualisiere...' : 'Jetzt aktualisieren'}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Ergebnis</h3>
          <div className="space-y-2">
            <p>
              <strong>Kanäle verarbeitet:</strong> {result.channelsProcessed}
            </p>
            <p>
              <strong>Videos hinzugefügt:</strong> {result.videosAdded}
            </p>
            <p>
              <strong>Videos aktualisiert:</strong> {result.videosUpdated}
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <strong>Fehler:</strong>
                <ul className="list-disc list-inside mt-2 text-sm text-red-600 dark:text-red-400">
                  {result.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.timestamp && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Zeitstempel: {new Date(result.timestamp).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Automatische Updates</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Für automatische Updates können Sie einen der folgenden Ansätze verwenden:
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Lokaler Cron Job</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Fügen Sie folgende Zeile zu Ihrer crontab hinzu:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
              {`*/30 * * * * curl -X POST "http://localhost:3000/api/admin/poll?token=YOUR_ADMIN_TOKEN"`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">2. GitHub Actions (kostenlos)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Erstellen Sie eine GitHub Actions Workflow Datei:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
              {githubActionsYml}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">3. Manuell</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verwenden Sie den Button oben oder rufen Sie den Endpoint direkt auf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
