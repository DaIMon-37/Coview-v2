import React, { useState } from 'react';
import { Link, Film, Lock, Globe, Copy, Rocket, Bell, X, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { partyAPI } from '../services/api';
import Swal from 'sweetalert2';

const CreateParty = () => {
  const navigate = useNavigate();
  const { createParty, setCurrentVideo, user, token } = useApp();
  const [videoUrl, setVideoUrl] = useState('');
  const [partyTitle, setPartyTitle] = useState('Friday Movie Night');
  const [privacy, setPrivacy] = useState('public');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  const inviteLink = createdCode
    ? `${window.location.origin}/join?code=${createdCode}`
    : `${window.location.origin}/join`;

  const handleCopy = () => {
    navigator.clipboard.writeText(createdCode ? inviteLink : `${window.location.origin}/join`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toEmbedUrl = (url) => {
    if (!url) return url;
    try {
      const u = new URL(url);
      const host = u.hostname.replace('www.', '');

      // YouTube
      if (host === 'youtube.com' || host === 'youtu.be') {
        let id = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v');
        if (!id) id = u.pathname.split('/').pop();
        if (id) return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`;
      }

      // Facebook
      if (host === 'facebook.com' || host === 'fb.watch') {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
      }

      // Vimeo
      if (host === 'vimeo.com') {
        const id = u.pathname.split('/').filter(Boolean).pop();
        if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
      }

      // Dailymotion
      if (host === 'dailymotion.com') {
        const id = u.pathname.split('/video/')[1]?.split('_')[0];
        if (id) return `https://www.dailymotion.com/embed/video/${id}?autoplay=1`;
      }

      // Twitch
      if (host === 'twitch.tv') {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'videos') return `https://player.twitch.tv/?video=${parts[1]}&parent=${window.location.hostname}&autoplay=true`;
        return `https://player.twitch.tv/?channel=${parts[0]}&parent=${window.location.hostname}&autoplay=true`;
      }

      // Already an embed or direct file — use as-is
      return url;
    } catch {
      return url;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl) {
      Swal.fire({ icon: 'warning', title: 'Missing URL', text: 'Please enter a video URL' });
      return;
    }

    if (!token) {
      Swal.fire({
        icon: 'warning', title: 'Login Required',
        text: 'You need to be logged in to create a party.',
        confirmButtonColor: '#6366f1', confirmButtonText: 'Go to Login'
      }).then((r) => { if (r.isConfirmed) navigate('/login'); });
      return;
    }

    const embedUrl = toEmbedUrl(videoUrl);

    setLoading(true);
    try {
      const res = await partyAPI.create({ title: partyTitle, privacy, videoUrl: embedUrl, description, language });
      const { party } = res.data;

      setCurrentVideo(embedUrl);
      setCreatedCode(party.code);

      createParty({
        id: party.id,
        code: party.code,
        title: party.title,
        privacy: party.privacy,
        videoUrl: embedUrl,
        hostId: party.host_id || user?.id
      });

      Swal.fire({
        icon: 'success',
        title: 'Party Created!',
        html: `Your access code is: <strong style="font-size:1.5rem;letter-spacing:0.2em">${party.code}</strong>`,
        confirmButtonColor: '#6366f1'
      }).then(() => navigate(`/watch/${party.code}/chat`));

    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not create party' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1030] via-[#1a0a3e] to-[#05060f]"></div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xl font-bold tracking-wide">COVIEW</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Bell className="h-5 w-5" /></button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-[#252648] overflow-hidden">
            {user?.avatar && <img src={user.avatar} alt="" className="w-full h-full object-cover" />}
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-[#0d0e24]/95 backdrop-blur-xl border border-[#252648] rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#252648]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><Film className="h-5 w-5 text-white" /></div>
              <div>
                <h1 className="text-xl font-bold text-white">Create Watch Party</h1>
                <p className="text-sm text-gray-400">Host a synchronized experience for your crew</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1b3a] transition-all"><X className="h-4 w-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Video URL</label>
              <div className="relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0a0b1e] border border-[#252648] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                  placeholder="YouTube, Vimeo, Facebook, Twitch, Dailymotion..." required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Party Title</label>
                <input type="text" value={partyTitle} onChange={(e) => setPartyTitle(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0a0b1e] border border-[#252648] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0a0b1e] border border-[#252648] rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm">
                  {['English','Spanish','French','German','Japanese','Korean','Portuguese','Italian'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description <span className="text-gray-600">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                placeholder="What are you watching tonight?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPrivacy('public')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${privacy === 'public' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'bg-[#0a0b1e] border border-[#252648] text-gray-400 hover:text-white'}`}>
                  <Globe className="h-4 w-4" />Public
                </button>
                <button type="button" onClick={() => setPrivacy('private')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${privacy === 'private' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'bg-[#0a0b1e] border border-[#252648] text-gray-400 hover:text-white'}`}>
                  <Lock className="h-4 w-4" />Private
                </button>
              </div>
            </div>

            <div className="bg-[#0a0b1e] border border-[#252648] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Invite Link</span>
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">{createdCode ? 'Ready' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-2.5 bg-[#05060f] border border-[#252648] rounded-lg text-sm text-gray-300 font-mono truncate">
                  {createdCode ? inviteLink : 'Create party to get link'}
                </div>
                <button type="button" onClick={handleCopy} disabled={!createdCode}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-all" title="Copy Link">
                  <Copy className="h-4 w-4 text-white" />
                </button>
              </div>
              {copied && <div className="text-xs text-green-400 mt-2">Copied to clipboard!</div>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-base">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Rocket className="h-5 w-5" />Create Party</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateParty;
