import React, { useState, useEffect } from 'react';
import { Search, Users, Globe, Lock, Play, Eye, RefreshCw, Filter, TrendingUp, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { partyAPI } from '../services/api';
import Swal from 'sweetalert2';

const MOCK_ROOMS = [
  { id: 1, code: 'ABC123', title: 'Friday Movie Night 🎬', currentUsers: 8, maxUsers: 20, language: 'English', currentMedia: 'Interstellar (2014)', privacy: 'public', genre: 'Sci-Fi', host: 'CinemaKing', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', isLive: true, isDemo: true },
  { id: 2, code: 'XYZ789', title: 'Anime Marathon 🌸', currentUsers: 14, maxUsers: 30, language: 'Japanese', currentMedia: 'Attack on Titan S4', privacy: 'public', genre: 'Anime', host: 'OtakuMaster', thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', isLive: true, isDemo: true },
  { id: 3, code: 'DEF456', title: 'Chill Vibes Only 🎵', currentUsers: 3, maxUsers: 10, language: 'English', currentMedia: 'Lo-Fi Beats Mix', privacy: 'public', genre: 'Music', host: 'ChillGuy', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', isLive: true, isDemo: true },
  { id: 4, code: 'GHI012', title: 'Horror Night 👻', currentUsers: 6, maxUsers: 15, language: 'English', currentMedia: 'The Conjuring', privacy: 'public', genre: 'Horror', host: 'ScaryDave', thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', isLive: false, isDemo: true },
  { id: 5, code: 'JKL345', title: 'Documentary Club 📚', currentUsers: 5, maxUsers: 12, language: 'English', currentMedia: 'Planet Earth III', privacy: 'public', genre: 'Documentary', host: 'DocFan', thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', isLive: true, isDemo: true },
  { id: 6, code: 'MNO678', title: 'K-Drama Watch Party 🇰🇷', currentUsers: 11, maxUsers: 25, language: 'Korean', currentMedia: 'Squid Game S2', privacy: 'public', genre: 'Drama', host: 'KDramaQueen', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', isLive: true, isDemo: true },
];

const LANGUAGES = ['All', 'English', 'Japanese', 'Korean', 'Spanish', 'French', 'German'];
const GENRES = ['All', 'Sci-Fi', 'Anime', 'Music', 'Horror', 'Documentary', 'Drama', 'Action', 'Comedy'];

const PublicRooms = () => {
  const navigate = useNavigate();
  const { token, joinParty, setCurrentVideo } = useApp();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [joiningCode, setJoiningCode] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await partyAPI.getPublic({ language: langFilter !== 'All' ? langFilter : undefined, search: search || undefined });
      const backendRooms = (res.data.rooms || []).map(r => ({
        id: r.id, code: r.code, title: r.title,
        currentUsers: r.currentUsers ?? 0, maxUsers: 20,
        language: r.language || 'English',
        currentMedia: r.video_url ? 'Now Playing' : 'No video',
        privacy: r.privacy, genre: 'General',
        host: r.users?.username || 'Unknown',
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
        isLive: !!r.isLive,
      }));
      // The backend now only returns rooms that are genuinely live, so an
      // empty list here is accurate — show the real (possibly empty) result
      // rather than papering over it with fake demo rooms.
      setRooms(backendRooms);
    } catch {
      // Only fall back to demo data if the request itself failed (backend
      // unreachable) — and mark it clearly so it isn't mistaken for real,
      // joinable rooms.
      setRooms(MOCK_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []); // eslint-disable-line

  const filtered = rooms
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.currentMedia.toLowerCase().includes(search.toLowerCase()))
    .filter(r => langFilter === 'All' || r.language === langFilter)
    .filter(r => genreFilter === 'All' || r.genre === genreFilter)
    .sort((a, b) => {
      if (sortBy === 'popular') return b.currentUsers - a.currentUsers;
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'active') return (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0);
      return 0;
    });

  const handleJoin = async (room) => {
    if (room.isDemo) {
      Swal.fire({
        icon: 'info', title: 'This is a preview room',
        text: "This demo room isn't real — create your own party to get a live, joinable room.",
        confirmButtonColor: '#6366f1', confirmButtonText: 'Create a Party'
      }).then(r => { if (r.isConfirmed) navigate('/create'); });
      return;
    }
    if (!token) {
      Swal.fire({
        icon: 'warning', title: 'Login Required',
        text: 'You need to be logged in to join a room.',
        confirmButtonColor: '#6366f1', confirmButtonText: 'Login'
      }).then(r => { if (r.isConfirmed) navigate('/login', { state: { from: '/rooms' } }); });
      return;
    }
    setJoiningCode(room.code);
    try {
      const res = await partyAPI.join(room.code);
      const p = res.data.party;
      if (p.video_url) setCurrentVideo(p.video_url);
      joinParty({ id: p.id, code: p.code, title: p.title, hostId: p.host_id });
      navigate(`/watch/${p.code}/chat`);
    } catch {
      // fallback for mock rooms
      navigate(`/join?code=${room.code}`);
    } finally {
      setJoiningCode(null);
    }
  };

  const handleRefresh = () => { fetchRooms(); };

  const stats = { total: rooms.length, live: rooms.filter(r => r.isLive).length, watching: rooms.reduce((s, r) => s + r.currentUsers, 0) };

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      {/* Nav */}
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
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/create')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all">
            + Create Room
          </button>
          {token ? (
            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-[#13142e] border border-[#252648] text-gray-300 text-sm rounded-lg hover:border-indigo-500 transition-all">Profile</button>
          ) : (
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-[#13142e] border border-[#252648] text-gray-300 text-sm rounded-lg hover:border-indigo-500 transition-all">Login</button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="h-8 w-8 text-indigo-400" /> Public Rooms
          </h1>
          <p className="text-gray-400">Join an active watch party and watch together with people around the world.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Globe className="h-5 w-5 text-indigo-400" />, label: 'Active Rooms', value: stats.total },
            { icon: <Zap className="h-5 w-5 text-green-400" />, label: 'Live Now', value: stats.live },
            { icon: <Users className="h-5 w-5 text-purple-400" />, label: 'Watching Now', value: stats.watching },
          ].map((s, i) => (
            <div key={i} className="bg-[#13142e] border border-[#252648] rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-[#0a0b1e] rounded-lg">{s.icon}</div>
              <div><div className="text-2xl font-bold text-white">{s.value}</div><div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms or content..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#13142e] border border-[#252648] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          </div>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#13142e] border border-[#252648] rounded-lg text-gray-300 text-sm focus:outline-none focus:border-indigo-500">
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#13142e] border border-[#252648] rounded-lg text-gray-300 text-sm focus:outline-none focus:border-indigo-500">
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-[#13142e] border border-[#252648] rounded-lg p-1">
            {[['popular', <TrendingUp className="h-3.5 w-3.5" />], ['active', <Zap className="h-3.5 w-3.5" />], ['newest', <Clock className="h-3.5 w-3.5" />]].map(([val, icon]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all capitalize ${sortBy === val ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {icon}{val}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={loading}
            className="p-2.5 bg-[#13142e] border border-[#252648] rounded-lg text-gray-400 hover:text-white transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Room Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No live rooms right now</p>
            <p className="text-sm mt-1 mb-6">Nobody's watching together at the moment — start your own and be the first!</p>
            <button onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all">
              + Create a Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(room => (
              <div key={room.id} className="bg-[#13142e] border border-[#252648] rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all group">
                <div className="relative h-40 overflow-hidden">
                  <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#13142e] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {room.isDemo && (
                      <span className="px-2 py-0.5 bg-yellow-600 rounded text-[10px] font-bold text-white">PREVIEW</span>
                    )}
                    {room.isLive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />LIVE
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-semibold text-gray-300 uppercase">{room.genre}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    {room.privacy === 'public' ? <Globe className="h-4 w-4 text-green-400" /> : <Lock className="h-4 w-4 text-yellow-400" />}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-base mb-1 truncate">{room.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
                    <Play className="h-3 w-3" />{room.currentMedia}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.currentUsers}/{room.maxUsers}</span>
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{room.language}</span>
                    </div>
                    <span className="text-xs text-gray-500">by <span className="text-indigo-400">{room.host}</span></span>
                  </div>
                  {/* User count bar */}
                  <div className="w-full h-1 bg-[#0a0b1e] rounded-full mb-4">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(room.currentUsers / room.maxUsers) * 100}%` }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleJoin(room)} disabled={joiningCode === room.code}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                      {joiningCode === room.code ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      {room.isDemo ? 'Preview' : 'Join Room'}
                    </button>
                    <button onClick={() => Swal.fire({ title: room.title, html: `<div style="text-align:left;color:#9ca3af;font-size:14px"><p><b style="color:white">Host:</b> ${room.host}</p><p><b style="color:white">Watching:</b> ${room.currentMedia}</p><p><b style="color:white">Language:</b> ${room.language}</p><p><b style="color:white">Users:</b> ${room.currentUsers}/${room.maxUsers}</p></div>`, confirmButtonColor: '#6366f1' })}
                      className="p-2 bg-[#0a0b1e] border border-[#252648] hover:border-indigo-500 text-gray-400 hover:text-white rounded-lg transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRooms;
