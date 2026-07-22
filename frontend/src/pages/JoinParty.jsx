import React, { useState, useRef, useEffect } from 'react';
import { Link as LinkIcon, ArrowRight, HelpCircle, PlusCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { partyAPI } from '../services/api';
import Swal from 'sweetalert2';

const JoinParty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinParty, token, setCurrentVideo } = useApp();
  const [activeTab, setActiveTab] = useState('code');
  const [partyLink, setPartyLink] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isJoining, setIsJoining] = useState(false);
  const [joinProgress, setJoinProgress] = useState(0);
  const inputRefs = useRef([]);

  // Pre-fill code from URL param
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && urlCode.length === 6) {
      setCode(urlCode.toUpperCase().split(''));
    }
  }, [searchParams]);

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^[a-zA-Z0-9]*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value.toUpperCase();
      setCode(newCode);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6).toUpperCase().split('');
    const newCode = [...code];
    pasted.forEach((char, i) => { if (i < 6 && /^[A-Z0-9]$/.test(char)) newCode[i] = char; });
    setCode(newCode);
  };

  const toEmbedUrl = (url) => {
    if (!url) return url;
    try {
      const u = new URL(url);
      const host = u.hostname.replace('www.', '');
      if (host === 'youtube.com' || host === 'youtu.be') {
        let id = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v');
        if (!id) id = u.pathname.split('/').pop();
        if (id && !url.includes('/embed/')) return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`;
      }
      return url;
    } catch { return url; }
  };

  const startJoining = (partyData) => {
    const embedUrl = partyData.video_url ? toEmbedUrl(partyData.video_url) : null;
    // Don't set currentVideo here — let room-state/video-loaded from socket override it
    // Only set as fallback if socket room has no video
    joinParty({
      id: partyData.id,
      code: partyData.code,
      title: partyData.title || `Room ${partyData.code}`,
      hostId: partyData.host_id,
      videoUrl: embedUrl,  // passed to emitJoinParty so backend seeds RoomManager if empty
    });
    setIsJoining(true);
    setJoinProgress(0);
    const interval = setInterval(() => {
      setJoinProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate(`/watch/${partyData.code}/chat`), 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const requireLogin = (targetCode) => {
    const returnPath = targetCode ? `/join?code=${targetCode}` : '/join';
    navigate('/login', { state: { from: returnPath } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) return;

    if (!token) {
      requireLogin(fullCode);
      return;
    }

    try {
      const res = await partyAPI.join(fullCode);
      startJoining(res.data.party);
    } catch (err) {
      const msg = err.response?.data?.message || 'Party not found';
      Swal.fire({ icon: 'error', title: 'Invalid Code', text: msg, confirmButtonColor: '#6366f1' });
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = new URL(partyLink);
      const codeFromLink = url.searchParams.get('code');
      if (!codeFromLink) throw new Error('No code in link');
      if (!token) { requireLogin(codeFromLink); return; }
      const res = await partyAPI.join(codeFromLink);
      startJoining(res.data.party);
    } catch {
      Swal.fire({ icon: 'error', title: 'Invalid Link', text: 'Could not find a party with that link.', confirmButtonColor: '#6366f1' });
    }
  };

  if (isJoining) {
    return (
      <div className="min-h-screen bg-[#05060f] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full"></div>
        <div className="relative z-10 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 text-xl font-bold tracking-wider mb-6">COVIEW</div>
        <div className="relative z-10 w-full max-w-md bg-[#0d0e24]/80 backdrop-blur-xl border border-[#252648] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Joining Party...</h1>
            <p className="text-sm text-indigo-400">Connecting to your watch session</p>
          </div>
          <div className="space-y-6">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <div key={index} className="w-12 h-12 bg-[#0a0b1e] border border-[#252648] rounded-lg flex items-center justify-center text-lg font-bold text-white">{digit || '•'}</div>
              ))}
            </div>
            <div className="relative">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-indigo-400 font-semibold">JOINING SESSION...</span>
                <span className="text-gray-500 font-semibold">{joinProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[#0a0b1e] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${joinProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060f] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full"></div>

      <button onClick={() => navigate('/')} className="relative z-10 mb-6 hover:opacity-80 transition-opacity">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </button>
      <div className="relative z-10 text-xl font-bold tracking-wider mb-6">COVIEW</div>

      <div className="relative z-10 w-full max-w-md bg-[#0d0e24]/80 backdrop-blur-xl border border-[#252648] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Join Watch Party</h1>
          <p className="text-sm text-indigo-400">Ready to watch with your crew?</p>
        </div>

        <div className="flex border-b border-[#252648] mb-6">
          <button onClick={() => setActiveTab('code')} className={`flex-1 py-3 text-sm font-medium transition-all relative ${activeTab === 'code' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Access Code
            {activeTab === 'code' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
          </button>
          <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 text-sm font-medium transition-all relative ${activeTab === 'link' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Party Link
            {activeTab === 'link' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
          </button>
        </div>

        {activeTab === 'code' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" inputMode="text" maxLength={1}
                  value={digit} onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)} onPaste={handlePaste}
                  className="w-12 h-12 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all uppercase"
                  placeholder="•" />
              ))}
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2">
              Join via Code <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input type="url" value={partyLink} onChange={(e) => setPartyLink(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#0a0b1e] border border-[#252648] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                placeholder="https://coview.app/join?code=..." required />
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2">
              Join Party Room <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#252648]/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-semibold text-gray-500 tracking-wider">AWAITING INPUT</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 tracking-wider">SECURITY: <span className="text-green-500">HIGH</span></div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-6 mt-6">
        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"><HelpCircle className="h-4 w-4" />Need help?</button>
        <button onClick={() => navigate('/create')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"><PlusCircle className="h-4 w-4" />Create Party</button>
      </div>
    </div>
  );
};

export default JoinParty;
