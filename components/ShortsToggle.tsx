'use client';

interface ShortsToggleProps {
  hideShorts: boolean;
  onToggle: (hide: boolean) => void;
}

export function ShortsToggle({ hideShorts, onToggle }: ShortsToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={hideShorts}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-2 focus:ring-ring focus:ring-offset-2 accent-primary"
        />
        <span className="text-sm font-medium text-foreground">
          Shorts ausblenden
        </span>
      </label>
    </div>
  );
}
