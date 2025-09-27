import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NewspaperCard } from "./NewspaperCard";
import { NewspaperDetail } from "./NewspaperDetail";
import { LoadingState } from "./LoadingState";
import { Id } from "../../convex/_generated/dataModel";

export function GlobalFeed() {
  const [limit, setLimit] = useState(20);
  const [selectedNewspaperId, setSelectedNewspaperId] = useState<Id<"created_newspapers"> | null>(null);
  const newspapers = useQuery(api.newspapers.listNewspapers, { limit });

  const handleLoadMore = () => {
    setLimit(prev => prev + 20);
  };

  const handleCardClick = (newspaperId: Id<"created_newspapers">) => {
    setSelectedNewspaperId(newspaperId);
  };

  const handleCloseDetail = () => {
    setSelectedNewspaperId(null);
  };

  if (newspapers === undefined) {
    return <LoadingState />;
  }

  if (newspapers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
          </svg>
        </div>
        <p className="text-zinc-400 text-lg">No newspapers created yet</p>
        <p className="text-zinc-500 text-sm mt-2">Be the first to create a personalized newspaper!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <span>Recently Created Newspapers</span>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </div>
          </h2>
          <p className="text-sm text-zinc-500">Real-time feed from all users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newspapers.map((newspaper, index) => (
            <div
              key={newspaper._id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-slide-up"
            >
              <NewspaperCard
                newspaper={newspaper}
                onClick={() => handleCardClick(newspaper._id)}
              />
            </div>
          ))}
        </div>

        {newspapers.length >= limit && (
          <div className="text-center pt-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg
                       border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {selectedNewspaperId && (
        <NewspaperDetail
          newspaperId={selectedNewspaperId}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
}