import React, { useState } from 'react';
import { Play, MessageCircle, Globe, Check, Sun, Moon, ChevronDown, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === lang);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openPressLink = (publication) => {
    const links = {
      'VARIETY': 'https://variety.com',
      'THE VERGE': 'https://theverge.com',
      'WIRED': 'https://wired.com',
      'HOLLYWOOD': 'https://hollywoodreporter.com'
    };
    window.open(links[publication], '_blank');
  };

  const features = [
    {
      icon: <Play className="h-6 w-6 text-indigo-400" />,
      title: 'Perfect Sync',
      desc: 'Frame-accurate synchronization ensures no one misses a beat. Our proprietary low-latency engine keeps everyone on the exact same millisecond.'
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-indigo-400" />,
      title: 'Live Social Chat',
      desc: 'Integrated crystal-clear audio and text chat for real-time reactions. High-fidelity voice rooms with spatial audio support.'
    },
    {
      icon: <Globe className="h-6 w-6 text-indigo-400" />,
      title: 'Global Access',
      desc: 'Connect with friends and family across borders without latency. Optimized CDN network spanning 40+ global edge locations.'
    }
  ];

  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  ];

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 sticky top-0 bg-[#0a0b1e]/95 backdrop-blur-md z-40">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-wide">Coview</span>
          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider ml-1">LIVE THEATER</span>
        </button>

        <div className="flex items-center gap-6">
          <button onClick={() => scrollToSection('features')} className="text-sm text-gray-400 hover:text-white transition-colors">Features</button>
          <button onClick={() => navigate('/rooms')} className="text-sm text-gray-400 hover:text-white transition-colors">Browse Rooms</button>
          <button onClick={() => scrollToSection('pricing')} className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</button>
          <button onClick={() => navigate('/premium')} className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
            <Crown className="h-3.5 w-3.5" />Upgrade
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#13142e] border border-[#252648] rounded-lg text-sm text-gray-300 hover:border-indigo-500 transition-all">
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.label}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#13142e] border border-[#252648] rounded-xl shadow-2xl z-50 overflow-hidden">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${lang === l.code ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-300 hover:bg-[#1a1b3a]'}`}>
                    <span>{l.flag}</span>{l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Theme Toggle */}
          <button onClick={() => setDarkMode(v => !v)}
            className="p-2 bg-[#13142e] border border-[#252648] rounded-lg text-gray-400 hover:text-white hover:border-indigo-500 transition-all">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">Dashboard</button>
              <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-[#252648] overflow-hidden flex items-center justify-center">
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-white">{user.name?.[0]?.toUpperCase() || 'U'}</span>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">Login</button>
              <button onClick={() => navigate('/signup')} className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all">Sign Up</button>
            </>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Now in Public Beta</span>
        </div>

        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
          Watch Together,<br />
          <span className="text-indigo-500">Anywhere.</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Experience real-time synchronized video playback with integrated social interaction. Join the ultimate watch party from any corner of the globe.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <button onClick={() => navigate('/create')} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/25">
            <Play className="h-4 w-4" />
            Start Your Party
          </button>
          <button onClick={() => navigate('/join')} className="flex items-center gap-2 px-6 py-3 bg-[#13142e] hover:bg-[#1a1b3a] border border-[#252648] text-white font-semibold rounded-lg transition-all">
            Join Party
          </button>
        </div>

        {/* Meet the Team */}
        <div className="max-w-4xl mx-auto bg-[#1a1b2e] rounded-2xl p-8 border border-[#252648]">
          <div className="bg-gradient-to-br from-[#1a4a5a] to-[#0d2a3a] rounded-xl p-12 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Meet Our Team</div>
              <h3 className="text-2xl font-bold text-white mb-8">The people behind CoView</h3>

              <div className="flex items-center gap-10">
                                {[
                { name: "Bipin Maharjan", photo: "/team/bipin.jpg" },
                { name: "Suprem Malla", photo: "/team/suprem.jpg" },
                { name: "Nirmal Ghimire", photo: "/team/nirmal.jpg" },
                ].map((member) => (
                <div key={member.name} className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-[#2a5a6a] border-2 border-[#3a7a8a] flex items-center justify-center overflow-hidden shadow-lg">
                    <img
                        src={member.photo}
                        className="w-full h-full object-cover"
                        alt={member.name}
                    />
                    </div>
                    <span className="text-sm font-medium text-gray-200">{member.name}</span>
                </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Experience the Future of Cinema</h2>
          <p className="text-gray-400">Designed for cinephiles who value perfect synchronization and social connection.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-[#13142e] border border-[#252648] rounded-xl p-6 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="community" className="max-w-4xl mx-auto px-8 py-16 text-center">
        <div className="text-xs font-semibold text-gray-500 tracking-widest uppercase mb-8">
          Trusted by Thousands of Cinephiles
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex -space-x-3">
            {avatars.map((avatar, idx) => (
              <img key={idx} src={avatar} className="w-10 h-10 rounded-full border-2 border-[#0a0b1e] object-cover" alt={`User ${idx}`} />
            ))}
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-[#0a0b1e] flex items-center justify-center text-xs font-bold text-white">
            +2K
          </div>
        </div>

        <div className="flex items-center justify-center gap-10 text-gray-500 font-semibold text-lg">
          <button onClick={() => openPressLink('VARIETY')} className="hover:text-white transition-colors cursor-pointer">VARIETY</button>
          <button onClick={() => openPressLink('THE VERGE')} className="hover:text-white transition-colors cursor-pointer">THE VERGE</button>
          <button onClick={() => openPressLink('WIRED')} className="hover:text-white transition-colors cursor-pointer">WIRED</button>
          <button onClick={() => openPressLink('HOLLYWOOD')} className="hover:text-white transition-colors cursor-pointer">HOLLYWOOD</button>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="max-w-4xl mx-auto px-8 py-16">
        <div className="bg-gradient-to-br from-[#1a1b3a] to-[#13142e] border border-[#252648] rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to host your first party?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join over 50,000 monthly active users watching movies, sports, and series together in perfect harmony.
          </p>
          <button onClick={() => navigate('/signup')} className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/25 mb-4">
            Get Started for Free
          </button>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              No credit card required
            </span>
            <span>•</span>
            <span>Instant setup</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 bg-[#0a0b1e]">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="font-bold text-white">CoView</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">The ultimate synchronized watch party platform. Watch together, anywhere.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <div className="space-y-2">
                {[['Features', '#features'], ['Pricing', '#pricing'], ['Browse Rooms', '/rooms'], ['Premium', '/premium']].map(([label, href]) => (
                  <button key={label} onClick={() => href.startsWith('/') ? navigate(href) : scrollToSection(href.slice(1))}
                    className="block text-xs text-gray-500 hover:text-white transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map(label => (
                  <button key={label} onClick={() => alert(`${label} page coming soon!`)}
                    className="block text-xs text-gray-500 hover:text-white transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'FAQ', 'Cookie Policy'].map(label => (
                  <button key={label} onClick={() => alert(`${label} coming soon!`)}
                    className="block text-xs text-gray-500 hover:text-white transition-colors">{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex items-center justify-between">
            <p className="text-xs text-gray-600">© 2024 CoView Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[['Twitter', 'https://twitter.com'], ['Discord', 'https://discord.com'], ['GitHub', 'https://github.com']].map(([name, url]) => (
                <button key={name} onClick={() => window.open(url, '_blank')}
                  className="text-xs text-gray-500 hover:text-white transition-colors">{name}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;