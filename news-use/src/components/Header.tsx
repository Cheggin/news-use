export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <img
              src="/browser-use-logo.png"
              alt="news-use logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-white">news-use</span>
          </div>
          <span className="text-xs text-orange-500 font-medium self-end mb-1.5">[BETA] YOUR PERSONAL NEWS AGENT</span>
        </div>
      </div>
    </header>
  );
}