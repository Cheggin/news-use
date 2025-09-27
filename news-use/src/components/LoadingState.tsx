export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-zinc-800 rounded-xl animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 rounded-xl animate-spin"
             style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
      </div>
      <p className="mt-4 text-zinc-400 animate-pulse">Loading newspapers...</p>
    </div>
  );
}