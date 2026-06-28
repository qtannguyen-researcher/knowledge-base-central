'use client';

interface SuggestionListProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionList({ suggestions, onSelect }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="max-h-60 overflow-auto rounded-md bg-white py-1 text-sm text-gray-700 shadow-lg">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
          >
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
  );
}
