import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, PlusCircle, LogIn, Clock, Compass, Crown, Bell, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isGuest, logout } = useApp();

  const displayName = user?.name || 'there';

  const quickLinks = [
    { icon: <Compass className="h-5 w-5" />, label: 'Browse Rooms', to: '/rooms' },
    { icon: <Clock className="h-5 w-5" />, label: 'History', to: '/history', guestLocked: true },
    { icon: <Crown className="h-5 w-5" />, label: 'Premium', to: '/premium' },
  ];

  return (
    <div className="min-h-screen bg-[#05060f] text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full"></div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xl font-bold tracking-wide">COVIEW</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-[#252648] overflow-hidden">
            {user?.avatar && <img src={user.avatar} alt="" className="w-full h-full object-cover" />}
          </button>
          <button onClick={() => { logout(); navigate('/'); }} title="Log out"
            className="w-10 h-10 rounded-full bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-8 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {displayName} 👋</h1>
          <p className="text-gray-400">Start a new watch party or jump into one with a code.</p>
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <button onClick={() => navigate('/create')}
            className="group text-left bg-[#0d0e24]/80 border border-[#252648] hover:border-indigo-500/60 rounded-2xl p-8 transition-all shadow-xl">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create a Party</h2>
            <p className="text-sm text-gray-400">Host a new synchronized watch session and invite your crew with an access code.</p>
          </button>

          <button onClick={() => navigate('/join')}
            className="group text-left bg-[#0d0e24]/80 border border-[#252648] hover:border-indigo-500/60 rounded-2xl p-8 transition-all shadow-xl">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Join a Party</h2>
            <p className="text-sm text-gray-400">Enter an access code or paste an invite link to join friends already watching.</p>
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <button key={link.label}
              onClick={() => (link.guestLocked && isGuest) ? navigate('/signup') : navigate(link.to)}
              className="flex items-center gap-3 bg-[#0d0e24]/60 border border-[#252648] hover:border-indigo-500/40 rounded-xl px-5 py-4 text-left transition-all">
              <span className="text-indigo-400">{link.icon}</span>
              <span className="text-sm font-medium text-gray-200">{link.label}</span>
            </button>
          ))}
        </div>

        {isGuest && (
          <div className="mt-8 flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-4">
            <Play className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <p className="text-sm text-gray-300">
              You're browsing as a guest. <button onClick={() => navigate('/signup')} className="text-indigo-400 hover:text-indigo-300 font-medium">Create an account</button> to save your history and host parties.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
