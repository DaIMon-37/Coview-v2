import React, { useState, useCallback } from "react";
import { Search, Plus, Loader2, X } from "lucide-react";
import { searchAPI } from "../services/api";

const YoutubeSearchModal = ({ isOpen, onClose, onAdd }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAPI.youtube(query.trim());
      setResults(res.data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAdd = (video) => {
    onAdd({
      id: Date.now(),
      title: video.title,
      genre: "YouTube",
      status: "In queue",
      duration: "—",
      url: video.embedUrl,
      thumbnail: video.thumbnail,
      color: "from-red-900/40 to-orange-900/40",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0d0e24] border border-[#252648] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#252648]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-400" /> Search YouTube
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for videos..."
              className="flex-1 px-4 py-2.5 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
              autoFocus
            />
            <button type="submit" disabled={loading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-all flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            )}
            {!loading && searched && results.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">No results found. Try a different search.</div>
            )}
            {!loading && !searched && (
              <div className="text-center text-gray-600 text-sm py-8">Search for YouTube videos to add to the queue</div>
            )}
            {!loading && results.map((video) => (
              <div key={video.videoId}
                className="flex gap-3 p-2.5 bg-[#0a0b1e] border border-[#252648] rounded-lg hover:border-indigo-500/50 transition-all group">
                <img src={video.thumbnail} alt={video.title}
                  className="w-28 h-16 rounded object-cover flex-shrink-0 bg-[#13142e]"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400"; }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">{video.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{video.author}</div>
                </div>
                <button onClick={() => handleAdd(video)}
                  className="flex-shrink-0 p-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all self-center">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeSearchModal;
