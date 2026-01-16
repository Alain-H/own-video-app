import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

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
      <div className="mb-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <iframe
            src={embedUrl}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">{videoTitle}</h1>
        {videoChannels && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Kanal: {videoChannels.title || videoChannels.channel_id}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Veröffentlicht: {formatDate(videoPublishedAt)}
        </p>
        {videoIsShort && (
          <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            SHORTS
          </span>
        )}
      </div>
      <div className="mt-4">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Auf YouTube öffnen →
        </a>
      </div>
    </div>
  );
}
