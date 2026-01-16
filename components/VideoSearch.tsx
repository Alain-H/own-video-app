'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';
import type { VideoWithChannel } from '@/lib/supabase/types';

interface VideoSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoSearch({ isOpen, onClose }: VideoSearchProps) {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setVideos([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setVideos(data);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!videos.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < videos.length) {
          const video = videos[selectedIndex];
          window.location.href = `/watch/${video.youtube_video_id}`;
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [videos, selectedIndex, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setVideos([]);
      setSelectedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-search-result]');
      const selected = items[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // We'll need to expose openSearch somehow, for now just handle escape
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 dark:bg-primary/30 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] z-[var(--z-dialog-overlay)]" onClick={onClose}>
      <div 
        className="bg-card text-card-foreground rounded-lg shadow-modern-lg border border-border glass-effect z-[var(--z-dialog-content)] w-full max-w-3xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Videos durchsuchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 pl-10 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4" ref={resultsRef}>
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
              <span className="text-sm">Suche...</span>
            </div>
          )}

          {!loading && query.trim().length >= 2 && videos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium mb-1">Keine Ergebnisse gefunden</p>
              <p className="text-xs">Versuche andere Suchbegriffe</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium mb-1">Tippe zum Suchen</p>
              <p className="text-xs">Mindestens 2 Zeichen erforderlich</p>
            </div>
          )}

          {!loading && videos.length > 0 && (
            <div className="space-y-2">
              {videos.map((video, index) => {
                const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.youtube_video_id}`}
                    onClick={onClose}
                    data-search-result
                    className={`block rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-accent border-primary shadow-sm scale-[1.02]'
                        : 'bg-card border-transparent hover:bg-accent/50'
                    }`}
                  >
                    <div className="p-3 flex gap-3">
                      <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {video.is_short && (
                          <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                            SHORTS
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1 line-clamp-2">
                          {highlightText(video.title, query)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {video.channels && (
                            <span className="font-medium text-foreground">
                              {video.channels.title || video.channels.channel_id}
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatRelativeTime(video.published_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {videos.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">↑↓</kbd>
                  Navigieren
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">↵</kbd>
                  Öffnen
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">Esc</kbd>
                  Schließen
                </span>
              </div>
              <span className="text-xs">{videos.length} Ergebnis{videos.length !== 1 ? 'se' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
