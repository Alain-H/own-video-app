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
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Shorts ausblenden
        </span>
      </label>
    </div>
  );
}
