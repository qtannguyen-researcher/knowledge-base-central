'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { SuggestionList } from './SuggestionList';

interface SearchBarProps {
  className?: string;
  defaultQuery?: string;
  debounceMs?: number;
  livePreview?: boolean;
}

export function SearchBar({
  className = '',
  defaultQuery = '',
  debounceMs = 300,
  livePreview = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
    },
    [router],
  );

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(
      async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/v1/search/suggestions?q=${encodeURIComponent(query.trim())}`,
          );
          if (response.ok) {
            const data = (await response.json()) as { suggestions: string[] };
            setSuggestions(data.suggestions ?? []);
            setShowSuggestions((data.suggestions?.length ?? 0) > 0);
          }
        } catch {
          // ignore suggestions errors
        } finally {
          setIsLoading(false);
        }
      },
      livePreview ? debounceMs : 0,
    );

    return () => clearTimeout(timer);
  }, [query, livePreview, debounceMs]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(query);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={onSubmit} role="search" aria-label="Site search">
        <label htmlFor="site-search" className="sr-only">
          Search knowledge base
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search articles..."
            className="input-field w-full pr-10"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-brand-600"
            aria-label="Submit search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7-7 0 11-14 0 7-7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>
      <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-50 mt-1">
        {showSuggestions && (
          <SuggestionList
            suggestions={suggestions}
            onSelect={(value) => {
              setQuery(value);
              navigate(value);
            }}
          />
        )}
      </div>
      {isLoading && showSuggestions && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
}
