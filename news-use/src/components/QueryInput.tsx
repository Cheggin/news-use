import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function QueryInput() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const createNewspaper = useMutation(api.newspapers.createNewspaper);

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
      headlines: headlines
    }).then(() => {
      setQuery("");
      setIsLoading(false);
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-16">
      <div
        ref={inputRef}
        className="relative rounded-xl"
        onMouseMove={handleMouseMove}
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What do you want to stay informed about?"
          className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500
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
      </div>
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="mt-4 w-full md:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium
                 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                 transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30"
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Creating newspaper...</span>
          </span>
        ) : (
          "Create Newspaper"
        )}
      </button>
    </form>
  );
}