# Mini YouTube App

Eine moderne Webapp als "Mini YouTube" mit Node.js + TypeScript, Next.js (App Router), Tailwind CSS und Supabase (Postgres) als Datenbank. Die App nutzt ausschließlich RSS-Feeds für Kanal-Updates - keine YouTube Data API, kein OAuth, keine kostenpflichtigen Services.

## Features

- **Feed-Seite**: Zeigt Videos von manuell gepflegten Kanälen chronologisch mit Thumbnail, Titel, Kanal und Datum
- **Shorts-Filterung**: Automatische Erkennung und Filterung von Shorts basierend auf Titel/URL
- **Kanal-Verwaltung**: Einfaches Hinzufügen von Kanälen via Channel ID oder RSS URL
- **Video-Import**: Upload von JSON/CSV/TXT Dateien zum Import mehrerer Kanäle
- **Manuelles Video-Hinzufügen**: Speichern einzelner Videos via YouTube Link
- **RSS Polling**: Automatische Updates via Cron, GitHub Actions oder manuell

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL)
- **fast-xml-parser** (RSS Parsing)
- **zod** (Validation)

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Environment Variables

Erstellen Sie eine `.env.local` Datei basierend auf `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Füllen Sie die folgenden Variablen aus:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Für Client-Side (optional, falls benötigt)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Token for protected endpoints
ADMIN_TOKEN=your_secret_admin_token_here
```

### 3. Datenbank-Schema erstellen

Führen Sie folgendes SQL-Schema in Ihrer Supabase SQL Console aus:

```sql
-- channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text UNIQUE NOT NULL,
  title text,
  rss_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_polled_at timestamptz
);

-- videos table
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id text UNIQUE NOT NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  title text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL,
  thumbnail_url text,
  is_hidden boolean DEFAULT false,
  is_short boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- saved_videos table
CREATE TABLE saved_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id text NOT NULL,
  source_url text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(youtube_video_id)
);

-- Indexes für bessere Performance
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_is_hidden ON videos(is_hidden);
CREATE INDEX idx_videos_is_short ON videos(is_short);
```

### 4. Development Server starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

## RSS Polling Setup

Die App bietet drei Optionen für automatische RSS-Updates:

### Option A: Lokaler Cron Job

Fügen Sie folgende Zeile zu Ihrer crontab hinzu (`crontab -e`):

```bash
*/30 * * * * curl -X POST "http://localhost:3000/api/admin/poll?token=YOUR_ADMIN_TOKEN"
```

Ersetzen Sie `YOUR_ADMIN_TOKEN` mit dem Wert aus Ihrer `.env.local` Datei.

**Hinweis**: Für Production sollten Sie die vollständige URL Ihrer App verwenden.

### Option B: GitHub Actions (kostenlos)

Erstellen Sie eine Datei `.github/workflows/poll-rss.yml`:

```yaml
name: Poll RSS Feeds
on:
  schedule:
    - cron: '*/30 * * * *'  # Alle 30 Minuten
  workflow_dispatch:  # Optional: Manuell auslösbar

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Poll RSS
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/admin/poll?token=${{ secrets.ADMIN_TOKEN }}"
```

Fügen Sie folgende Secrets zu Ihrem GitHub Repository hinzu:
- `APP_URL`: Die vollständige URL Ihrer App (z.B. `https://your-app.vercel.app`)
- `ADMIN_TOKEN`: Der Admin Token aus Ihrer `.env.local`

### Option C: Manuell

Nutzen Sie den "Jetzt aktualisieren" Button im Admin Panel (`/admin`).

## Verwendung

### Kanal hinzufügen

1. Navigieren Sie zu `/channels`
2. Klicken Sie auf "Kanal hinzufügen"
3. Geben Sie entweder:
   - Eine Channel ID ein (z.B. `UCxxxx...`)
   - Oder eine RSS URL direkt

Die App berechnet automatisch die RSS URL aus der Channel ID.

### Kanäle importieren

1. Navigieren Sie zu `/import`
2. Laden Sie eine Datei hoch (JSON, CSV oder TXT)
3. Die App versucht automatisch Channel IDs oder RSS URLs zu erkennen

**Unterstützte Formate:**

**JSON:**
```json
[
  "UCxxxx...",
  { "channel_id": "UCyyyy...", "title": "Kanal Name" },
  { "rss_url": "https://..." }
]
```

**CSV:**
```csv
UCxxxx...,Kanal Name
UCyyyy...,Anderer Kanal
```

**TXT (eine pro Zeile):**
```
UCxxxx...
UCyyyy...
https://www.youtube.com/feeds/videos.xml?channel_id=UCzzzz...
```

### Video manuell hinzufügen

1. Navigieren Sie zu `/saved`
2. Klicken Sie auf "Video-Link hinzufügen"
3. Fügen Sie einen YouTube Link ein (watch, youtu.be oder shorts URL)
4. Das Video wird gespeichert und kann abgespielt werden

### Shorts filtern

Auf der Feed-Seite (`/feed`) können Sie Shorts mit dem Toggle "Shorts ausblenden" ausblenden. Die App erkennt Shorts automatisch basierend auf:
- Titel enthält `#shorts` oder `shorts` (case-insensitive)
- URL enthält `/shorts/`

## Projektstruktur

```
own-video-app/
├── app/
│   ├── layout.tsx          # Root Layout mit Navigation
│   ├── page.tsx            # Redirect zu /feed
│   ├── feed/               # Feed-Seite
│   ├── channels/           # Kanal-Verwaltung
│   ├── saved/              # Gespeicherte Videos
│   ├── watch/[videoId]/    # Video Player
│   ├── import/             # Import-Seite
│   ├── admin/              # Admin Panel
│   └── api/                # API Routes
├── lib/
│   ├── supabase/           # Supabase Clients & Types
│   ├── rss/                # RSS Parser
│   ├── youtube/            # YouTube URL Parser
│   └── utils.ts            # Utility Functions
└── components/             # React Components
```

## TypeScript Types

Die App verwendet manuelle TypeScript Types für die Datenbank. Für eine automatische Generierung können Sie Supabase CLI verwenden:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

## Production Deployment

Für Production-Deployment (z.B. Vercel):

1. Setzen Sie alle Environment Variables in den Deployment-Einstellungen
2. Stellen Sie sicher, dass `ADMIN_TOKEN` sicher gespeichert ist
3. Konfigurieren Sie einen Cron Job oder GitHub Actions Workflow für automatische Updates

## Sicherheit

- Der `/api/admin/poll` Endpoint ist durch `ADMIN_TOKEN` geschützt
- Server-side Supabase Client verwendet Service Role Key (bypasses RLS)
- Client-side verwendet Anon Key (kann durch RLS Policies geschützt werden)

## Lizenz

MIT
