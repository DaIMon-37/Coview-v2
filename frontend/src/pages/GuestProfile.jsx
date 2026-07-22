import React from 'react';
import { Compass, Users, Bell, Clock, Star, Play, Shield, ArrowRight, Film, Tv, History, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuestProfile = () => {
  const navigate = useNavigate();
  const perks = [
    { icon: <Film className="h-5 w-5 text-indigo-400" />, title: 'Personalized Playlists', desc: 'Curated specifically for your taste' },
    { icon: <Tv className="h-5 w-5 text-indigo-400" />, title: 'Host Your Own Parties', desc: 'Invite friends for private screenings' },
    { icon: <History className="h-5 w-5 text-indigo-400" />, title: 'Save Watch History', desc: "Never lose track of what you've seen" },
    { icon: <Crown className="h-5 w-5 text-indigo-400" />, title: 'Exclusive Content', desc: 'Early access to premier events' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xl font-bold tracking-wide">COVIEW</span>
        </button>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><Compass className="h-4 w-4" /><span className="text-sm">Explore</span></button>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><Users className="h-4 w-4" /><span className="text-sm">Parties</span></button>
          <button className="relative text-gray-400 hover:text-white transition-colors"><Bell className="h-5 w-5" /></button>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">G</div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-[#13142e] border border-[#252648] rounded-2xl p-10 flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-[#1a1b3a]">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#13142e]"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Guest_4281</h1>
          <p className="text-gray-400 text-sm mb-6">Join a Party to start your journey</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1b3a] border border-[#252648] rounded-full">
              <Clock className="h-4 w-4 text-indigo-400" />
              <div className="text-left">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">Time Active</div>
                <div className="text-sm font-semibold text-white leading-none">0 Hours</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1b3a] border border-[#252648] rounded-full">
              <Star className="h-4 w-4 text-indigo-400" />
              <div className="text-left">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">Level</div>
                <div className="text-sm font-semibold text-white leading-none">Explorer</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#13142e] border border-[#252648] rounded-2xl p-8 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">Sign Up to Unlock Perks</h2>
            <p className="text-gray-400 text-sm mb-6">Transform your cinematic experience and connect with movie lovers worldwide.</p>
            <div className="grid grid-cols-2 gap-5 mb-6">
              {perks.map((perk, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">{perk.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{perk.title}</div>
                    <div className="text-xs text-gray-500 leading-tight">{perk.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/signup')} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/25">
              Create Account<ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative w-full lg:w-72 h-56 rounded-xl overflow-hidden bg-gradient-to-b from-[#1a1b3a] to-[#0a0b1e] border border-[#252648] flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="220" height="160" viewBox="0 0 220 160" className="opacity-90">
                <ellipse cx="110" cy="100" rx="95" ry="18" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.4"/>
                <circle cx="110" cy="90" r="38" fill="url(#planetGrad)"/>
                <ellipse cx="110" cy="82" rx="36" ry="4" fill="#4f46e5" opacity="0.3"/>
                <ellipse cx="110" cy="95" rx="36" ry="3" fill="#4f46e5" opacity="0.2"/>
                <ellipse cx="110" cy="100" rx="95" ry="18" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.6"/>
                <ellipse cx="110" cy="100" rx="85" ry="14" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4"/>
                <circle cx="50" cy="40" r="4" fill="#c7d2fe" opacity="0.7"/>
                <circle cx="170" cy="55" r="2.5" fill="#c7d2fe" opacity="0.5"/>
                <defs>
                  <radialGradient id="planetGrad" cx="40%" cy="40%">
                    <stop offset="0%" stopColor="#818cf8"/>
                    <stop offset="100%" stopColor="#312e81"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute bottom-4 left-4">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Next Phase</div>
              <div className="text-sm font-semibold text-white">Join the Universe</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mt-10 mb-8">
          <div className="flex items-center gap-2 text-gray-400"><Clock className="h-4 w-4 text-indigo-400" /><span className="text-sm"><span className="text-white font-semibold">1,204</span> ACTIVE PARTIES</span></div>
          <div className="flex items-center gap-2 text-gray-400"><Play className="h-4 w-4 text-indigo-400" /><span className="text-sm"><span className="text-white font-semibold">8.2K</span> WATCHING NOW</span></div>
          <div className="flex items-center gap-2 text-gray-400"><Shield className="h-4 w-4 text-indigo-400" /><span className="text-sm font-semibold">SECURE ECOSYSTEM</span></div>
        </div>

        <footer className="text-center text-xs text-gray-600 pt-6 border-t border-white/5">© 2024 Coview Platform. All systems operational.</footer>
      </main>
    </div>
  );
};

export default GuestProfile;