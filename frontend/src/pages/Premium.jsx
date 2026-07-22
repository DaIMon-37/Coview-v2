import React, { useState } from 'react';
import { Crown, Check, Zap, Star, Shield, Sparkles, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Swal from 'sweetalert2';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'border-[#252648]',
    badge: null,
    features: [
      'Join public rooms',
      'Basic chat',
      'Standard quality (720p)',
      'Up to 5 users per room',
      'YouTube support',
    ],
    missing: ['No ads removal', 'No custom chat color', 'No GIF messages', 'No private rooms'],
    cta: 'Current Plan',
    ctaDisabled: true,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$4.99',
    period: '/month',
    color: 'border-indigo-500',
    badge: 'Popular',
    badgeColor: 'bg-indigo-600',
    features: [
      'Everything in Free',
      'No ads',
      'Custom chat color',
      'Animated chat effects',
      'GIF messages',
      'More reactions',
      'Up to 20 users per room',
      '1080p quality',
      'Private rooms',
    ],
    missing: [],
    cta: 'Upgrade to Plus',
    ctaDisabled: false,
    ctaColor: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    color: 'border-yellow-500',
    badge: 'Best Value',
    badgeColor: 'bg-yellow-600',
    features: [
      'Everything in Plus',
      'Ad-free rooms for all guests',
      'Registered users only rooms',
      'Disable recommendations',
      'Disable chat links',
      'Advanced room controls',
      'Unlimited users per room',
      '4K quality',
      'Priority support',
      'Early access to features',
    ],
    missing: [],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
    ctaColor: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.' },
  { q: 'Is there a free trial?', a: 'We offer a 7-day free trial for Plus and Pro plans. No credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and Apple Pay.' },
  { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
];

const Premium = () => {
  const navigate = useNavigate();
  const { user, token } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const [billing, setBilling] = useState('monthly');

  const handleUpgrade = (plan) => {
    if (!token) {
      Swal.fire({
        icon: 'info', title: 'Login Required',
        text: 'Please log in to upgrade your plan.',
        confirmButtonColor: '#6366f1', confirmButtonText: 'Login'
      }).then(r => { if (r.isConfirmed) navigate('/login', { state: { from: '/premium' } }); });
      return;
    }
    Swal.fire({
      icon: 'success',
      title: `${plan.name} Plan Selected!`,
      html: `<p style="color:#9ca3af">This is a demo. In production, you would be redirected to the payment gateway.</p>`,
      confirmButtonColor: '#6366f1',
      confirmButtonText: 'Got it',
    });
  };

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
          {token ? (
            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-[#13142e] border border-[#252648] text-gray-300 text-sm rounded-lg hover:border-indigo-500 transition-all">Profile</button>
          ) : (
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all">Login</button>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
            <Crown className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 tracking-wider uppercase">Premium Plans</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Upgrade Your Experience</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Unlock the full CoView experience with premium features designed for serious watch party hosts.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${billing === 'yearly' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
              Yearly <span className="text-green-400 text-xs font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative bg-[#13142e] border-2 ${plan.color} rounded-2xl p-6 flex flex-col`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 ${plan.badgeColor} rounded-full text-xs font-bold text-white`}>
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {plan.id === 'pro' ? <Crown className="h-5 w-5 text-yellow-400" /> : plan.id === 'plus' ? <Star className="h-5 w-5 text-indigo-400" /> : <Shield className="h-5 w-5 text-gray-400" />}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {billing === 'yearly' && plan.price !== '$0' ? `$${(parseFloat(plan.price.slice(1)) * 0.8).toFixed(2)}` : plan.price}
                  </span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
                {plan.missing.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <X className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => !plan.ctaDisabled && handleUpgrade(plan)} disabled={plan.ctaDisabled}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${plan.ctaDisabled ? 'bg-[#0a0b1e] border border-[#252648] text-gray-500 cursor-default' : `${plan.ctaColor} text-white shadow-lg`}`}>
                {!plan.ctaDisabled && <Sparkles className="h-4 w-4" />}
                {plan.cta}
                {!plan.ctaDisabled && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <div className="bg-[#13142e] border border-[#252648] rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252648]">
                  <th className="text-left py-3 text-gray-400 font-medium">Feature</th>
                  {PLANS.map(p => <th key={p.id} className="text-center py-3 text-white font-bold">{p.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252648]/50">
                {[
                  ['Max users per room', '5', '20', 'Unlimited'],
                  ['Video quality', '720p', '1080p', '4K'],
                  ['Ad-free experience', '✗', '✓', '✓'],
                  ['Custom chat color', '✗', '✓', '✓'],
                  ['GIF messages', '✗', '✓', '✓'],
                  ['Private rooms', '✗', '✓', '✓'],
                  ['Ad-free for guests', '✗', '✗', '✓'],
                  ['Advanced room controls', '✗', '✗', '✓'],
                  ['Priority support', '✗', '✗', '✓'],
                ].map(([feat, ...vals]) => (
                  <tr key={feat}>
                    <td className="py-3 text-gray-300">{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`py-3 text-center font-medium ${v === '✓' ? 'text-green-400' : v === '✗' ? 'text-gray-600' : 'text-white'}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#13142e] border border-[#252648] rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
