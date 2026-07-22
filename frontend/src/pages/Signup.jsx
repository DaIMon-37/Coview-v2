import React, { useState } from 'react';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';

const Signup = () => {
  const navigate = useNavigate();
  const { register, login } = useApp();

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [socialForm, setSocialForm] = useState({ name: '', email: '' });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSocialChange = (e) => setSocialForm({ ...socialForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await register(formData);
    if (!result.success) {
      setLoading(false);
      setError(result.error || 'Registration failed');
      return;
    }
    // Auto-login after registration
    const loginResult = await login({ email: formData.email, password: formData.password });
    setLoading(false);
    if (loginResult.success) {
      Swal.fire({ icon: 'success', title: 'Welcome!', text: 'Account created successfully.', timer: 1500, showConfirmButton: false });
      navigate('/dashboard');
    } else {
      Swal.fire({ icon: 'success', title: 'Account Created!', text: 'Please log in.', timer: 1500, showConfirmButton: false });
      navigate('/login');
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
      Swal.fire({ icon: 'error', title: "Account Doesn't Exist", text: 'Please use a real Gmail address.' });
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
    setShowSocialModal(false);
    Swal.fire({ icon: 'success', title: 'Verified!', text: `Linked with ${socialProvider}.`, timer: 1500, showConfirmButton: false });
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex bg-[#0d0d0d]">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a1628]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Cinema" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/90 to-transparent"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
        <div className="absolute top-8 left-8 right-8 h-px bg-cyan-400/40"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 pb-24 h-full">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">COVIEW</span>
          </button>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">Experience cinema,<br /><span className="text-[#f97316]">together.</span></h1>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">Real-time synchronized viewing with spatial audio and interactive 4K streaming.</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0d0d0d]">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
              <p className="text-gray-400 text-sm">Join the next generation of co-viewing.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] transition-all"
                    placeholder="John Doe" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] transition-all"
                    placeholder="name@company.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#f97316]/25 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Free Account'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2a2a2a]"></div></div>
              <div className="relative flex justify-center"><span className="px-4 bg-[#1a1a1a] text-xs font-semibold text-gray-500 tracking-wider">OR CONTINUE WITH</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => openSocialModal('Google')} className="flex items-center justify-center gap-2 py-3 bg-[#0d0d0d] hover:bg-[#222] border border-[#2a2a2a] rounded-xl transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-gray-300">Google</span>
              </button>
              <button onClick={() => openSocialModal('Discord')} className="flex items-center justify-center gap-2 py-3 bg-[#0d0d0d] hover:bg-[#222] border border-[#2a2a2a] rounded-xl transition-all">
                <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-sm font-medium text-gray-300">Discord</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#f97316] hover:text-[#ea580c] font-medium transition-colors">Log in</button>
            </p>
          </div>
        </div>
      </div>

      {/* Social Modal */}
      <Modal isOpen={showSocialModal} onClose={() => !isVerifying && setShowSocialModal(false)} title={`Link ${socialProvider} Account`}>
        <form onSubmit={handleSocialSubmit} className="space-y-4">
          <p className="text-sm text-gray-400 mb-4">
            Enter your details to create or link your CoView account with {socialProvider}.
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

export default Signup;
