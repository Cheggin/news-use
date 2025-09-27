import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";


interface NewspaperDetailProps {
  newspaperId: Id<"created_newspapers">;
  onClose: () => void;
}

export function NewspaperDetail({ newspaperId, onClose }: NewspaperDetailProps) {
  const newspaper = useQuery(api.newspapers.getNewspaper, { id: newspaperId });
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  if (!newspaper) {
    return null;
  }

  const toggleArticle = (articleKey: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleKey)) {
        newSet.delete(articleKey);
      } else {
        newSet.add(articleKey);
      }
      return newSet;
    });
  };

  const articles = Object.entries(newspaper.newspapers || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl
                    overflow-hidden flex flex-col animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{newspaper.query}</h2>
              <p className="text-sm text-zinc-400">
                {newspaper.articleCount} articles • Created {new Date(newspaper.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {articles.map(([key, article]) => {
            const isExpanded = expandedArticles.has(key);
            const content = article.content || "";
            const preview = content.substring(0, 200);
            const hasMore = content.length > 200;

            return (
              <div key={key} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex-1">
                    {content.split(".")[0] || "Article"}
                  </h3>
                </div>

                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-500 hover:text-orange-400 transition-colors inline-flex items-center space-x-1 mb-3"
                >
                  <span>{article.link}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <div className="text-zinc-300 text-sm leading-relaxed">
                  {isExpanded ? content : preview}
                  {hasMore && !isExpanded && "..."}
                </div>

                {hasMore && (
                  <button
                    onClick={() => toggleArticle(key)}
                    className="mt-3 text-sm text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    {isExpanded ? "Show Less" : "Read Full Article"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}