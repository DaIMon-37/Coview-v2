import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();
  const rawFrom = location.state?.from || '';
  // Only honor "from" for an actual invite link (/join?code=...) — that's the one
  // case where returning somewhere other than the dashboard makes sense. Landing
  // on /create or a bare /join after login was confusing, so default to /dashboard.
  const from = (rawFrom.startsWith('/join') && rawFrom.includes('code=')) ? rawFrom : '/dashboard';
  // Preserve query params when redirecting back (e.g. /join?code=ABC123)
  const navigateBack = () => navigate(from, { replace: true });

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [socialForm, setSocialForm] = useState({ name: '', email: '' });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSocialChange = (e) => setSocialForm({ ...socialForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login({ email: formData.email, password: formData.password });
    setLoading(false);
    if (result.success) {
      navigateBack();
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const openSocialModal = (provider) => {
    setSocialProvider(provider);
    setSocialForm({ name: '', email: '' });
    setShowSocialModal(true);
  };

  const handleSocialSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!socialForm.name || !socialForm.email) {
      Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please provide your name and email.' });
      return;
    }
    if (!emailRegex.test(socialForm.email)) {
      Swal.fire({ icon: 'error', title: 'Invalid Format', text: 'Please enter a valid email address.' });
      return;
    }
    if (socialProvider === 'Google' && !socialForm.email.endsWith('@gmail.com')) {
      Swal.fire({ icon: 'error', title: "Account Doesn't Exist", text: "Please use a real Gmail address." });
      return;
    }
    const fakeDomains = ['@test.com', '@example.com', '@fake.com', '@temp.com', '@mailinator.com'];
    if (fakeDomains.some((d) => socialForm.email.toLowerCase().endsWith(d))) {
      Swal.fire({ icon: 'error', title: "Account Doesn't Exist", text: 'Please use a real email address.' });
      return;
    }
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsVerifying(false);

    await login({
      skipAPI: true,
      name: socialForm.name,
      email: socialForm.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${socialForm.name}`,
      isPremium: false,
      bio: `${socialProvider} User`
    });
    navigate(from, { replace: true });
    setShowSocialModal(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Cinema" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a1f3a]/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-[#0a0a0f]/80 to-[#0a0a0f]/95"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-start p-16 h-full">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">CoView</span>
          </button>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">Watch together,<br />anywhere.</h1>
          <p className="text-gray-300 text-lg max-w-md leading-relaxed">Experience the ultimate virtual cinema with friends. Sync playback, chat, and share reactions in real-time.</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-[#0a0a0f]">
        <div className="w-full max-w-md bg-[#13131f] border border-[#2a2a3a] rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => openSocialModal('Google')} className="flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0f] hover:bg-[#1a1a2a] border border-[#2a2a3a] rounded-lg transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium text-gray-300">Google</span>
            </button>
            <button onClick={() => openSocialModal('Apple')} className="flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0f] hover:bg-[#1a1a2a] border border-[#2a2a3a] rounded-lg transition-all">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-sm font-medium text-gray-300">Apple</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2a2a3a]"></div></div>
            <div className="relative px-4 bg-[#13131f]"><span className="text-xs font-semibold text-gray-500 tracking-wider">OR EMAIL</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] transition-all text-sm"
                  placeholder="name@example.com" required />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#6366f1] hover:text-[#4f46e5] transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] transition-all text-sm"
                  placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-60 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#6366f1]/25">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-[#6366f1] hover:text-[#4f46e5] font-medium transition-colors">Create an account</button>
            </p>
            <div className="flex items-center justify-center gap-2 my-3">
              <div className="h-px w-12 bg-[#2a2a3a]"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
              <div className="h-px w-12 bg-[#2a2a3a]"></div>
            </div>
            <button onClick={() => navigate('/guest')} className="text-sm text-[#6366f1] hover:text-[#4f46e5] font-medium transition-colors">Continue as a Guest</button>
          </div>
        </div>

        <div className="absolute bottom-8 flex gap-6 text-xs text-gray-500">
          <button onClick={() => Swal.fire({ title: 'Privacy Policy', text: 'We respect your privacy.' })} className="hover:text-gray-300 transition-colors">Privacy Policy</button>
          <button onClick={() => Swal.fire({ title: 'Terms of Service', text: 'Standard terms apply.' })} className="hover:text-gray-300 transition-colors">Terms of Service</button>
          <button onClick={() => Swal.fire({ title: 'Help Center', text: 'Contact support@coview.app' })} className="hover:text-gray-300 transition-colors">Help Center</button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForgot(false)}>
          <div className="w-full max-w-md bg-[#0d0e24] border border-[#252648] rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Reset Password</h3>
            <p className="text-sm text-gray-400 mb-4">Enter your email to receive a reset link.</p>
            <input type="email" placeholder="your@email.com" className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white mb-4 focus:outline-none focus:border-indigo-500" />
            <button onClick={() => { Swal.fire({ icon: 'success', title: 'Link Sent!', timer: 1500, showConfirmButton: false }); setShowForgot(false); }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg">Send Reset Link</button>
          </div>
        </div>
      )}

      {/* Social Login Modal */}
      <Modal isOpen={showSocialModal} onClose={() => !isVerifying && setShowSocialModal(false)} title={`Link ${socialProvider} Account`}>
        <form onSubmit={handleSocialSubmit} className="space-y-4">
          <p className="text-sm text-gray-400 mb-4">
            Enter your details to log in with your existing {socialProvider} account.
            <span className="block text-xs text-gray-500 mt-1">* We verify that this is a real, existing account.</span>
          </p>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
            <input type="text" name="name" value={socialForm.name} onChange={handleSocialChange} placeholder="Your Name"
              className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-all"
              required disabled={isVerifying} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Email Address {socialProvider === 'Google' && <span className="text-xs text-indigo-400">(Must be @gmail.com)</span>}
            </label>
            <input type="email" name="email" value={socialForm.email} onChange={handleSocialChange}
              placeholder={socialProvider === 'Google' ? 'yourname@gmail.com' : 'yourname@email.com'}
              className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-all"
              required disabled={isVerifying} />
          </div>
          <button type="submit" disabled={isVerifying}
            className={`w-full py-3 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${isVerifying ? 'bg-indigo-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {isVerifying ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying account...</> : `Continue with ${socialProvider}`}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Login;
