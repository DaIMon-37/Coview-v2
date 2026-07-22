import React, { useState, useEffect } from 'react';
import { Clock, Play, Trash2, Film, Search, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { chatAPI } from '../services/api';
import Swal from 'sweetalert2';

const MOCK_HISTORY = [
  { id: 1, title: 'Interstellar (2014)', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', duration: '2h 49m', watchedAt: '2 hours ago', roomName: 'Friday Movie Night', friends: 3, url: 'https://www.youtube.com/embed/zSWdZVtXT7E' },
  { id: 2, title: 'Inception (2010)', thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', duration: '2h 28m', watchedAt: 'Yesterday', roomName: 'Dream Team', friends: 5, url: 'https://www.youtube.com/embed/YoHD9XEInc0' },
  { id: 3, title: 'Blade Runner 2049', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', duration: '2h 44m', watchedAt: '3 days ago', roomName: 'Sci-Fi Club', friends: 2, url: 'https://www.youtube.com/embed/gCcx85zbxz4' },
  { id: 4, title: 'Dune: Part Two', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', duration: '2h 46m', watchedAt: 'Last week', roomName: 'Epic Watch Party', friends: 8, url: 'https://www.youtube.com/embed/Way9Dexny3w' },
  { id: 5, title: 'Oppenheimer', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', duration: '3h 0m', watchedAt: 'Last week', roomName: 'History Buffs', friends: 4, url: 'https://www.youtube.com/embed/uYPbbksJxIg' },
];

const History = () => {
  const navigate = useNavigate();
  const { setCurrentVideo, token } = useApp();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setHistory(MOCK_HISTORY); setLoading(false); return; }
    chatAPI.getUserHistory()
      .then(res => {
        const items = (res.data.history || []).map(r => ({
          id: r.id,
          title: r.title || 'Watch Party',
          thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
          duration: '—',
          watchedAt: r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : 'Unknown',
          roomName: r.title || 'Party',
          friends: 0,
          url: r.video_url || '',
        }));
        setHistory(items.length > 0 ? items : MOCK_HISTORY);
      })
      .catch(() => setHistory(MOCK_HISTORY))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

  const filtered = history.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));

  const handleRewatch = (item) => {
    setCurrentVideo(item.url);
    navigate('/create');
  };

  const handleDelete = (id) => {
    Swal.fire({ title: 'Remove from history?', icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Remove' })
      .then(r => { if (r.isConfirmed) setHistory(prev => prev.filter(h => h.id !== id)); });
  };

  const handleClearAll = () => {
    Swal.fire({ title: 'Clear all history?', text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Clear All' })
      .then(r => { if (r.isConfirmed) setHistory([]); });
  };

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#252648] bg-[#0a0b1e]/95 backdrop-blur-md sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold">CoView</span>
        </button>
        <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-[#13142e] border border-[#252648] text-gray-300 text-sm rounded-lg hover:border-indigo-500 transition-all">Profile</button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Clock className="h-8 w-8 text-indigo-400" />Watch History</h1>
            <p className="text-gray-400 mt-1">Your recently watched content</p>
          </div>
          {history.length > 0 && (
            <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 text-sm font-medium rounded-lg transition-all">
              <Trash2 className="h-4 w-4" />Clear All
            </button>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search history..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#13142e] border border-[#252648] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">{history.length === 0 ? 'No watch history yet' : 'No results found'}</p>
            <p className="text-sm mt-1">Start watching to build your history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="flex gap-4 p-4 bg-[#13142e] border border-[#252648] rounded-xl hover:border-indigo-500/50 transition-all group">
                <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-base truncate">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.duration}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.watchedAt}</span>
                    <span>Room: <span className="text-indigo-400">{item.roomName}</span></span>
                    {item.friends > 0 && <span>with {item.friends} friends</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleRewatch(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold rounded-lg transition-all">
                    <Play className="h-3.5 w-3.5" />Rewatch
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
