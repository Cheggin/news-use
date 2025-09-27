import { Doc } from "../../convex/_generated/dataModel";

interface NewspaperCardProps {
  newspaper: Doc<"created_newspapers">;
  onClick: () => void;
}

export function NewspaperCard({ newspaper, onClick }: NewspaperCardProps) {
  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700
               transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black/50
               hover:transform hover:scale-[1.02] animate-fade-in"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-orange-500 font-medium">NEW</span>
            <span className="text-xs text-zinc-500">{getRelativeTime(newspaper.createdAt)}</span>
            {newspaper.userName && (
              <>
                <span className="text-xs text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">by {newspaper.userName}</span>
              </>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-orange-500 transition-colors">
            {newspaper.query}
          </h3>
          <p className="text-sm text-zinc-400">
            {newspaper.articleCount} articles curated
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {newspaper.headlines.slice(0, 3).map((headline, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-orange-500 text-xs mt-1">▸</span>
            <p className="text-sm text-zinc-300 line-clamp-1">{headline}</p>
          </div>
        ))}
        {newspaper.headlines.length > 3 && (
          <p className="text-xs text-zinc-500 pl-4">+{newspaper.headlines.length - 3} more articles</p>
        )}
      </div>

      <button className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium
                       rounded-lg transition-colors duration-300 group-hover:bg-orange-500/10 group-hover:text-orange-500">
        View Newspaper →
      </button>
    </div>
  );
}