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
      <h1 className="text-3xl font-bold mb-6 text-foreground">Admin Panel</h1>
      <div className="bg-card text-card-foreground rounded-lg shadow-modern p-6 mb-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">RSS Updates</h2>
        <p className="text-muted-foreground mb-4">
          Aktualisieren Sie alle aktiven Kanäle manuell. Die App holt die neuesten Videos von den RSS Feeds.
        </p>
        <button
          onClick={handlePoll}
          disabled={loading}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Aktualisiere...' : 'Jetzt aktualisieren'}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      {result && (
        <div className="bg-card text-card-foreground rounded-lg shadow-modern p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Ergebnis</h3>
          <div className="space-y-2">
            <p className="text-foreground">
              <strong>Kanäle verarbeitet:</strong> {result.channelsProcessed}
            </p>
            <p className="text-foreground">
              <strong>Videos hinzugefügt:</strong> {result.videosAdded}
            </p>
            <p className="text-foreground">
              <strong>Videos aktualisiert:</strong> {result.videosUpdated}
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <strong className="text-foreground">Fehler:</strong>
                <ul className="list-disc list-inside mt-2 text-sm text-destructive">
                  {result.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.timestamp && (
              <p className="text-sm text-muted-foreground mt-4">
                Zeitstempel: {new Date(result.timestamp).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="bg-card text-card-foreground rounded-lg shadow-modern p-6 mt-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Automatische Updates</h2>
        <p className="text-muted-foreground mb-4">
          Für automatische Updates können Sie einen der folgenden Ansätze verwenden:
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2 text-foreground">1. Lokaler Cron Job</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Fügen Sie folgende Zeile zu Ihrer crontab hinzu:
            </p>
            <pre className="bg-muted/30 border border-border p-3 rounded-md text-sm overflow-x-auto text-foreground">
              {`*/30 * * * * curl -X POST "http://localhost:3000/api/admin/poll?token=YOUR_ADMIN_TOKEN"`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-foreground">2. GitHub Actions (kostenlos)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Erstellen Sie eine GitHub Actions Workflow Datei:
            </p>
            <pre className="bg-muted/30 border border-border p-3 rounded-md text-sm overflow-x-auto text-foreground">
              {githubActionsYml}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-foreground">3. Manuell</h3>
            <p className="text-sm text-muted-foreground">
              Verwenden Sie den Button oben oder rufen Sie den Endpoint direkt auf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
