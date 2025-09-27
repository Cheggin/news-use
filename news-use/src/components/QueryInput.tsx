import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { NewspaperDetail } from "./NewspaperDetail";

type ModelOption = "gemini-flash-3.0" | "gpt-4.1" | "gemini-flash-2.5";

const models = [
  { id: "gemini-flash-3.0" as ModelOption, name: "Gemini Flash 3.0" },
  { id: "gpt-4.1" as ModelOption, name: "GPT 4.1" },
  { id: "gemini-flash-2.5" as ModelOption, name: "Gemini Flash 2.5" },
];

export function QueryInput() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [includeInDatabase, setIncludeInDatabase] = useState(true);
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>("gemini-flash-3.0");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [createdNewspaperId, setCreatedNewspaperId] = useState<Id<"created_newspapers"> | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createNewspaper = useMutation(api.newspapers.createNewspaper);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);

    // For demo purposes, create a mock newspaper
    const mockArticles = {
      article1: {
        link: `https://example.com/${Date.now()}-1`,
        content: `Breaking news about ${query}. This is a comprehensive analysis of the latest developments in this area, providing in-depth coverage and expert insights into the matter at hand.`
      },
      article2: {
        link: `https://example.com/${Date.now()}-2`,
        content: `Latest updates on ${query}. Industry experts weigh in on the implications and future outlook, offering valuable perspectives on this evolving situation.`
      },
      article3: {
        link: `https://example.com/${Date.now()}-3`,
        content: `In-depth analysis: ${query}. A thorough examination of the key factors, stakeholders, and potential outcomes related to this important topic.`
      }
    };

    const headlines = [
      `Breaking: Major developments in ${query}`,
      `Expert analysis on ${query} trends`,
      `What you need to know about ${query}`
    ];

    createNewspaper({
      query: query,
      newspapers: mockArticles,
      articleCount: 3,
      headlines: headlines,
      userName: showNameInput && userName.trim() ? userName.trim() : undefined,
      isPublic: includeInDatabase
    }).then((newspaperId) => {
      setQuery("");
      setUserName("");
      setIsLoading(false);
      setCreatedNewspaperId(newspaperId);
    }).catch((error) => {
      console.error("Failed to create newspaper:", error);
      setIsLoading(false);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    }
  };

  const handleCloseNewspaper = () => {
    setCreatedNewspaperId(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-16">
      <div className="space-y-4">
        <div
          ref={inputRef}
          className="relative rounded-xl"
          onMouseMove={handleMouseMove}
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isLoading && query.trim()) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to stay informed about?"
            className="w-full px-6 py-4 pr-16 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500
                     focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                     transition-all duration-300 resize-none min-h-[120px]
                     hover:border-zinc-700 relative z-10"
            style={{
              background: isFocused && mousePosition.x > 0 ? `
                radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px,
                  rgba(255, 107, 53, 0.06),
                  transparent 40%),
                rgb(24, 24, 27)
              ` : 'rgb(24, 24, 27)'
            }}
            disabled={isLoading}
          />

          <div className="absolute bottom-3 right-3 flex items-center space-x-2 z-20">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium
                         transition-all duration-200 flex items-center space-x-1.5
                         ${query.trim()
                           ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                           : 'text-zinc-600 opacity-50'}`}
              >
                <span className="truncate">{models.find(m => m.id === selectedModel)?.name}</span>
                <svg className={`h-3 w-3 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                  {models.map(model => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors
                               ${selectedModel === model.id
                                 ? 'bg-orange-500/10 text-orange-500'
                                 : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    >
                      <span>{model.name}</span>
                      {selectedModel === model.id && (
                        <svg className="ml-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className={`p-1.5 rounded-full transition-all duration-200
                       ${query.trim() && !isLoading
                         ? 'bg-orange-500 hover:bg-orange-600 text-white border border-orange-500 hover:border-orange-600'
                         : 'bg-zinc-800 text-zinc-400 border border-zinc-700 disabled:opacity-30 disabled:text-zinc-600'}`}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 px-2">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                setIncludeInDatabase(!includeInDatabase)
                setShowNameInput(!showNameInput)
              }
            }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                includeInDatabase ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  includeInDatabase ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className="text-sm text-zinc-400">Share</label>
          </div>


          {showNameInput && (
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-48 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500
                       focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
                       transition-all duration-200 text-sm"
            />
          )}
        </div>
      </div>
    </form>

    {createdNewspaperId && (
      <NewspaperDetail
        newspaperId={createdNewspaperId}
        onClose={handleCloseNewspaper}
      />
    )}
    </>
  );
}