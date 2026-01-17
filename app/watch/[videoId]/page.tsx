import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { BackButton } from '@/components/BackButton';

interface WatchPageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;

  // Try to get video from videos table first
  let video = await db.getVideoByYoutubeId(videoId);

  // If not found, check saved_videos
  if (!video) {
    const savedVideos = await db.getSavedVideos();
    const savedVideo = savedVideos.find((v) => v.youtube_video_id === videoId);
    if (!savedVideo) {
      notFound();
    }
    // Use saved video info
    video = {
      id: savedVideo.id,
      youtube_video_id: savedVideo.youtube_video_id,
      channel_id: null,
      title: savedVideo.title || 'Unbenanntes Video',
      url: savedVideo.source_url,
      published_at: savedVideo.created_at,
      thumbnail_url: null,
      is_hidden: false,
      is_short: false,
      created_at: savedVideo.created_at,
      channels: null,
    } as any;
  }

  // TypeScript type guard: ensure video is not null
  if (!video) {
    notFound();
  }

  // Now TypeScript knows video is not null
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const videoTitle = video.title;
  const videoUrl = video.url;
  const videoPublishedAt = video.published_at;
  const videoIsShort = video.is_short;
  const videoChannels = video.channels;

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton />
      <div className="mb-6">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 border border-border shadow-modern">
          <iframe
            src={embedUrl}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">{videoTitle}</h1>
        {videoChannels && (
          <p className="text-muted-foreground mb-2">
            Kanal: <span className="text-foreground font-medium">{videoChannels.title || videoChannels.channel_id}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Veröffentlicht: {formatDate(videoPublishedAt)}
        </p>
        {videoIsShort && (
          <span className="inline-block mt-2 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md">
            SHORTS
          </span>
        )}
      </div>
      <div className="mt-4">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Auf YouTube öffnen →
        </a>
      </div>
    </div>
  );
}
