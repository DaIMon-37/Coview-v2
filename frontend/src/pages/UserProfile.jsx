import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Edit3, Share2, Users, Clock, Activity, Crown, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI, chatAPI } from '../services/api';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout, isGuest, updateUserProfile } = useApp();
  const [syncPref, setSyncPref] = useState(true);
  const [publicPresence, setPublicPresence] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(true);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

  const [stats, setStats] = useState({ partiesHosted: 0, partiesJoined: 0, messagesSent: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (isGuest) { setLoadingActivity(false); return; }
    authAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => {}); // stats are supplementary — leave zeros on failure

    chatAPI.getUserHistory()
      .then(res => setRecentActivity((res.data.history || []).slice(0, 3)))
      .catch(() => setRecentActivity([]))
      .finally(() => setLoadingActivity(false));
  }, [isGuest]);

  const formatWhen = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const Toggle = ({ enabled, onChange }) => (
    <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const checkGuestAccess = () => {
    if (isGuest) {
      Swal.fire({
        icon: 'warning',
        title: 'Guest Account',
        text: "You don't have an account. Please sign in first to use further features of our app.",
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Go to Login'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return false;
    }
    return true;
  };

  const handleShare = () => {
    if (!checkGuestAccess()) return;
    navigator.clipboard.writeText(window.location.href);
    Swal.fire({ icon: 'success', title: 'Copied!', text: 'Profile link copied to clipboard!', timer: 1500, showConfirmButton: false });
  };

  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!checkGuestAccess()) return;
    if (!editName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Name required', text: 'Display name cannot be empty.' });
      return;
    }
    setSavingProfile(true);
    const result = await updateUserProfile({
      name: editName.trim(),
      bio: editBio,
      avatar: editAvatar
    });
    setSavingProfile(false);
    if (result.success) {
      setShowEditModal(false);
      Swal.fire({ icon: 'success', title: 'Profile Updated!', text: 'Your changes have been saved successfully.', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: result.error || 'Could not save your changes.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c1e] text-white font-sans">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#252648] bg-[#0b0c1e]">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xl font-bold tracking-wide">COVIEW</span>
        </button>
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Search movies, friends, or parties..." className="w-full pl-10 pr-4 py-2 bg-[#13142e] border border-[#252648] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button className="text-gray-400 hover:text-white transition-colors relative"><Bell className="h-5 w-5" /></button>
          <button onClick={() => navigate('/rooms')} className="text-sm text-gray-400 hover:text-white transition-colors">Browse Rooms</button>
          <button onClick={() => navigate('/history')} className="text-sm text-gray-400 hover:text-white transition-colors">History</button>
          <button onClick={() => navigate('/premium')} className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors font-medium">Upgrade</button>
          <button onClick={() => { if(checkGuestAccess()) setShowSettingsModal(true); }} className="text-gray-400 hover:text-white transition-colors"><Settings className="h-5 w-5" /></button>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Logout</button>
          <img src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Profile" className="w-9 h-9 rounded-full border border-[#252648] object-cover" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-[#13142e] border border-[#252648] rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={user?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200'} alt={user?.name} className="w-20 h-20 rounded-full border-2 border-[#252648] object-cover" />
              {isGuest ? (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white">GUEST</div>
              ) : user?.isPremium ? (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white">PRO</div>
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">{user?.name || 'Guest User'}</h1>
              <div className="flex items-center gap-2 mt-1">
                {user?.isPremium ? <Crown className="h-3 w-3 text-yellow-500" /> : <Users className="h-3 w-3 text-gray-500" />}
                <span className={`text-xs font-semibold tracking-wider ${user?.isPremium ? 'text-indigo-400' : 'text-gray-400'}`}>
                  {isGuest ? 'GUEST ACCOUNT' : user?.isPremium ? 'PREMIUM MEMBER' : 'FREE MEMBER'}
                </span>
              </div>
              {user?.bio && <p className="text-sm text-gray-400 mt-2">{user.bio}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { if(checkGuestAccess()) setShowEditModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all">
              <Edit3 className="h-4 w-4" />Edit Profile
            </button>
            <button onClick={handleShare} className="p-2 bg-[#1a1b3a] border border-[#252648] hover:bg-[#252648] text-gray-400 hover:text-white rounded-lg transition-all">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-[#13142e] border border-[#252648] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg"><Users className="h-5 w-5 text-indigo-400" /></div>
            <div><div className="text-2xl font-bold text-white">{stats.partiesHosted}</div><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Parties Hosted</div></div>
          </div>
          <div className="bg-[#13142e] border border-[#252648] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg"><Clock className="h-5 w-5 text-indigo-400" /></div>
            <div><div className="text-2xl font-bold text-white">{stats.partiesJoined}</div><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Parties Joined</div></div>
          </div>
          <div className="bg-[#13142e] border border-[#252648] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg"><MessageSquare className="h-5 w-5 text-indigo-400" /></div>
            <div><div className="text-2xl font-bold text-white">{stats.messagesSent}</div><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Messages Sent</div></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-400" />Recent Activity</h2>
              {recentActivity.length > 0 && <button onClick={() => navigate('/history')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>}
            </div>
            {loadingActivity ? (
              <div className="bg-[#13142e] border border-[#252648] rounded-xl p-8 flex items-center justify-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : isGuest ? (
              <div className="bg-[#13142e] border border-[#252648] rounded-xl p-8 text-center text-gray-400">
                <p className="text-sm">Sign up to start tracking your watch parties.</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="bg-[#13142e] border border-[#252648] rounded-xl p-8 text-center text-gray-400">
                <p className="text-sm mb-4">No activity yet — join or host a party to see it here.</p>
                <button onClick={() => navigate('/dashboard')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Go to Dashboard</button>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} onClick={() => navigate(`/watch/${item.code}/chat`)}
                  className="bg-[#13142e] border border-[#252648] rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/50 transition-all cursor-pointer group">
                  <div className="w-24 h-16 rounded-lg bg-[#0b0c1e] border border-[#252648] flex items-center justify-center flex-shrink-0">
                    <Activity className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">Room code: {item.code}</p>
                  </div>
                  <div className="text-right flex-shrink-0"><div className="text-xs text-gray-500 uppercase tracking-wider">{formatWhen(item.joinedAt)}</div></div>
                </div>
              ))
            )}
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-[#13142e] border border-[#252648] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5"><Settings className="h-4 w-4 text-indigo-400" />Quick Settings</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div><div className="text-sm font-medium text-white">Sync Preferences</div><div className="text-[10px] text-gray-500 uppercase tracking-wider">LOW LATENCY MODE</div></div>
                  <Toggle enabled={syncPref} onChange={setSyncPref} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="text-sm font-medium text-white">Public Presence</div><div className="text-[10px] text-gray-500 uppercase tracking-wider">VISIBLE ONLY</div></div>
                  <Toggle enabled={publicPresence} onChange={setPublicPresence} />
                </div>
              </div>
              <div className="border-t border-[#252648] pt-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Connected Socials</div>
                <div className="space-y-2">
                  <button onClick={() => { if(checkGuestAccess()) setDiscordConnected(!discordConnected); }} className="w-full flex items-center justify-between p-2.5 bg-[#0b0c1e] border border-[#252648] rounded-lg hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#5865F2] rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      </div>
                      <span className="text-sm text-gray-300">Discord</span>
                    </div>
                    <span className={`text-[10px] font-bold ${discordConnected ? 'text-green-500' : 'text-gray-400'}`}>{discordConnected ? 'CONNECTED' : 'CONNECT'}</span>
                  </button>
                </div>
              </div>
              <button onClick={() => { if(checkGuestAccess()) setShowSettingsModal(true); }} className="w-full mt-4 py-2.5 text-sm text-indigo-400 hover:text-white bg-[#0b0c1e] hover:bg-indigo-600 border border-[#252648] hover:border-indigo-600 rounded-lg transition-all font-medium">Manage Full Account Settings</button>
            </div>

            <div className="bg-[#13142e] border border-[#252648] rounded-xl p-5 text-center">
              <div className="w-12 h-12 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-3"><Crown className="h-6 w-6 text-indigo-400" /></div>
              {user?.isPremium ? (
                <>
                  <h3 className="text-sm font-bold text-white mb-1">Premium Perks</h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">You have 4K streaming and unlimited party slots active.</p>
                  <button onClick={() => { if(checkGuestAccess()) setShowSubModal(true); }} className="w-full py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-[#0b0c1e] hover:bg-indigo-600 border border-[#252648] hover:border-indigo-600 rounded-lg transition-all">View Subscription Details</button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-white mb-1">Go Premium</h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">Unlock 4K streaming and unlimited party slots.</p>
                  <button onClick={() => navigate('/premium')} className="w-full py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-[#0b0c1e] hover:bg-indigo-600 border border-[#252648] hover:border-indigo-600 rounded-lg transition-all">Upgrade Now</button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Avatar URL</label>
            <div className="flex gap-3">
              <img src={editAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-[#252648]" />
              <input type="url" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://..." className="flex-1 px-4 py-2.5 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Bio</label>
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white resize-none" placeholder="Tell us about yourself..." />
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-all">{savingProfile ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Account Settings">
        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex justify-between py-2 border-b border-[#252648]"><span>Email</span><span className="text-white">{user?.email || 'guest@coview.com'}</span></div>
          <div className="flex justify-between py-2 border-b border-[#252648]"><span>Member Since</span><span className="text-white">{user?.joinedDate || 'Today'}</span></div>
          <div className="flex justify-between py-2 border-b border-[#252648]"><span>Plan</span><span className="text-indigo-400">{isGuest ? 'Guest' : user?.isPremium ? 'Premium' : 'Free'}</span></div>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">Logout</button>
        </div>
      </Modal>

      {/* Subscription Modal */}
      <Modal isOpen={showSubModal} onClose={() => setShowSubModal(false)} title="Subscription Details">
        <div className="space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Crown className="h-5 w-5 text-indigo-400" /><span className="font-semibold text-white">Premium Plan</span></div>
            <p className="text-sm text-gray-400">4K streaming, unlimited parties, priority support</p>
          </div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Next billing date</span><span className="text-white">March 15, 2026</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Amount</span><span className="text-white">$9.99/month</span></div>
          <button onClick={() => Swal.fire({ icon: 'info', title: 'Cancelled', text: 'Subscription cancelled.' })} className="w-full py-3 bg-[#0a0b1e] border border-[#252648] hover:border-red-500 text-red-400 font-semibold rounded-lg">Cancel Subscription</button>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfile;