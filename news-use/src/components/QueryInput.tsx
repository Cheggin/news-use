import { useState, useRef, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { NewspaperDetail } from "./NewspaperDetail";
import { type Article } from "../lib/api";

type ModelOption = "gemini-flash-latest" | "gpt-4.1" | "gemini-flash-2.5";

const models = [
  { id: "gemini-flash-latest" as ModelOption, name: "Gemini Flash Latest", available: true },
  { id: "gpt-4.1" as ModelOption, name: "GPT 4.1", available: false },
  { id: "gemini-flash-2.5" as ModelOption, name: "Gemini Flash 2.5", available: false },
];

export function QueryInput() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [includeInDatabase, setIncludeInDatabase] = useState(true);
  const [showNameInput, setShowNameInput] = useState(true);
  const [userName, setUserName] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>("gemini-flash-latest");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [createdNewspaperId, setCreatedNewspaperId] = useState<Id<"created_newspapers"> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [buildingArticles, setBuildingArticles] = useState<Article[]>([]);
  const [buildingSummary, setBuildingSummary] = useState<string>("");
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createNewspaper = useMutation(api.newspapers.createNewspaper);

  // Convex actions for secure API calls
  const searchNYT = useAction(api.fastapi.searchNYT);
  const searchWashPost = useAction(api.fastapi.searchWashPost);
  const summarizeArticles = useAction(api.fastapi.summarizeArticles);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setBuildingArticles([]);
    setBuildingSummary("");
    setLoadingStatus("Searching New York Times...");

    try {
      // Call NYT first, show results immediately
      const nytResponse = await searchNYT({ query });
      setBuildingArticles([...nytResponse.articles]);

      setLoadingStatus("Searching Washington Post...");

      // Then call WashPost, add to existing articles
      const washPostResponse = await searchWashPost({ query });
      const allArticles: Article[] = [
        ...nytResponse.articles,
        ...washPostResponse.articles
      ];
      setBuildingArticles(allArticles);

      if (allArticles.length === 0) {
        alert("No articles found. Please try a different query.");
        setIsLoading(false);
        setLoadingStatus("");
        setBuildingArticles([]);
        return;
      }

      setLoadingStatus(`Analyzing ${allArticles.length} articles with AI...`);

      // Summarize all articles
      const summaryResponse = await summarizeArticles({
        query,
        articles: allArticles
      });

      // Show the summary as it's generated
      setBuildingSummary(summaryResponse.summary);
      setLoadingStatus("Saving to database...");

      // Format the articles into the newspaper structure
      const newspapers: Record<string, { link: string; content: string; headline?: string }> = {};
      const headlines: string[] = [];

      // Add the AI summary as the FIRST item with a clear headline
      newspapers["0_summary"] = {
        link: "",
        content: summaryResponse.summary,
        headline: `Comprehensive Analysis: ${query}`
      };
      headlines.push(`Comprehensive Analysis: ${query}`);

      // Then add individual articles
      allArticles.forEach((article, index) => {
        newspapers[`article${index + 1}`] = {
          link: article.url,
          content: article.summary,
          headline: article.headline
        };
        headlines.push(article.headline);
      });

      setLoadingStatus("Creating your newspaper...");

      // Create newspaper in Convex
      const newspaperId = await createNewspaper({
        query: query,
        newspapers: newspapers,
        articleCount: allArticles.length,
        headlines: headlines,
        userName: showNameInput && userName.trim() ? userName.trim() : undefined,
        isPublic: includeInDatabase
      });

      setQuery("");
      setUserName("");
      setCreatedNewspaperId(newspaperId);
    } catch (error) {
      console.error("Failed to create newspaper:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to fetch articles"}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
      setBuildingArticles([]);
      setBuildingSummary("");
    }
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
      <form onSubmit={(e) => void handleSubmit(e)} className="w-full max-w-4xl mx-auto mb-16">
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
                void handleSubmit(e as any);
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
                <div className="absolute bottom-full mb-2 right-0 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                  {models.map(model => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        if (model.available) {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }
                      }}
                      disabled={!model.available}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors
                               ${!model.available
                                 ? 'text-zinc-500 cursor-not-allowed opacity-50'
                                 : selectedModel === model.id
                                   ? 'bg-orange-500/10 text-orange-500'
                                   : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{model.name}</span>
                        {!model.available && (
                          <span className="text-xs text-zinc-600">Coming Soon!</span>
                        )}
                      </span>
                      {selectedModel === model.id && model.available && (
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
                setIncludeInDatabase(!includeInDatabase);
                setShowNameInput(includeInDatabase ? false : true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
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
              className="w-48 px-3 py-0 h-6 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500
                       focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
                       transition-all duration-200 text-sm"
            />
          )}
        </div>
      </div>
    </form>

    {/* Building Newspaper View */}
    {isLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />

        <div className="relative w-full max-w-6xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up my-8">
          {/* Header */}
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Building Your Newspaper...</h2>
                <p className="text-sm text-zinc-400 mt-1">{loadingStatus}</p>
              </div>
              <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left: AI Summary */}
            <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full font-medium">
                    AI Summary
                  </span>
                  {buildingSummary ? (
                    <span className="text-xs text-green-500">✓ Complete</span>
                  ) : (
                    <span className="text-xs text-zinc-500">Waiting...</span>
                  )}
                </div>

                {buildingSummary ? (
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 text-sm leading-relaxed">
                    {buildingSummary.substring(0, 500)}...
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm italic">
                    AI summary will appear here once articles are collected...
                  </div>
                )}
              </div>
            </div>

            {/* Right: Source Articles */}
            <div className="w-full lg:w-1/2 overflow-y-auto bg-zinc-900/50">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <span className="px-3 py-1 text-xs bg-zinc-700 text-zinc-300 rounded-full font-medium">
                    {buildingArticles.length} Articles Found
                  </span>
                </div>

                <div className="space-y-4">
                  {buildingArticles.map((article, index) => (
                    <div key={index} className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4 animate-fade-in">
                      <h4 className="text-base font-semibold text-white mb-2">
                        {article.headline}
                      </h4>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-500 hover:text-orange-400 transition-colors inline-flex items-center space-x-1 mb-2"
                      >
                        <span className="truncate max-w-xs">View source</span>
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <p className="text-zinc-400 text-xs line-clamp-3">
                        {article.summary}
                      </p>
                    </div>
                  ))}

                  {buildingArticles.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm italic py-8">
                      Searching for articles...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {createdNewspaperId && (
      <NewspaperDetail
        newspaperId={createdNewspaperId}
        onClose={handleCloseNewspaper}
      />
    )}
    </>
  );
}