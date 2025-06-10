'use client';

import { useState } from 'react';
import Link from "next/link";
import AppScreenshot from './components/AppScreenshot';
import { Icons } from './components/Icons';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#E8F5E9] to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-[#f0f0f0]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#4CAF50]">
              Swipy
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="#features" className="text-[#333333] hover:text-[#4CAF50] transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-[#333333] hover:text-[#4CAF50] transition-colors">
              How it Works
            </Link>
            <Link href="#contact" className="text-[#333333] hover:text-[#4CAF50] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/20 to-[#8BC34A]/20 blur-3xl -z-10" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 -z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#4CAF50]/5 to-transparent -z-10" />
          <h1 className="text-7xl font-bold mb-6 text-[#333333] animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-[#4CAF50] to-[#8BC34A]">
            Swipe. Match. Eat.
          </h1>
          <p className="text-xl text-[#666666] mb-8 max-w-2xl mx-auto animate-fade-in-delay">
            Like Tinder, but for choosing restaurants with friends. Swipe restaurants, find matches, and go eat together
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#4CAF50] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#388E3C] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group"
            >
              <span className="relative z-10">Get Early Access</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' })}
              className="border-2 border-[#4CAF50] text-[#4CAF50] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#E8F5E9] transition-all transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/10 to-[#8BC34A]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-[#333333]">Why Choose Swipy?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#f0f0f0] transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <Icons.Target className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Smart Matching</h3>
              <p className="text-[#666666]">Find restaurants that everyone in your group will love</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#f0f0f0] transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <Icons.Lightning className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Quick Decisions</h3>
              <p className="text-[#666666]">No more endless debates about where to eat</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#f0f0f0] transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <Icons.Star className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Discover New Places</h3>
              <p className="text-[#666666]">Find hidden gems and popular spots in your area</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 bg-[#E8F5E9]/50">
        <h2 className="text-4xl font-bold text-center mb-16 text-[#333333]">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center transform hover:scale-105 hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Icons.Users className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Add Friends</h3>
              <p className="text-[#666666]">Invite your friends to join the app</p>
            </div>
          </div>
          <div className="text-center transform hover:scale-105 hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Icons.Refresh className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Swipe Restaurants</h3>
              <p className="text-[#666666]">Choose places you&apos;d like to try</p>
            </div>
          </div>
          <div className="text-center transform hover:scale-105 hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/5 to-[#8BC34A]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Icons.Party className="text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#333333]">Match & Go!</h3>
              <p className="text-[#666666]">When you match, it&apos;s time to eat!</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-[#333333]">Beautiful Interface</h2>
            <p className="text-xl text-[#666666] mb-8">
              A clean, intuitive design that makes choosing restaurants fun and easy
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                  <Icons.Check className="text-[#4CAF50]" />
                </span>
                <span className="text-[#333333]">Modern, card-based interface</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                  <Icons.Check className="text-[#4CAF50]" />
                </span>
                <span className="text-[#333333]">Smooth animations and transitions</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                  <Icons.Check className="text-[#4CAF50]" />
                </span>
                <span className="text-[#333333]">Real-time matching system</span>
              </li>
            </ul>
          </div>
          <div className="relative h-[600px]">
            <AppScreenshot />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6 text-[#333333]">Ready to Try?</h2>
        <p className="text-xl text-[#666666] mb-8 max-w-2xl mx-auto">
          Join the waitlist to be among the first to experience Swipy
        </p>
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full border border-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] shadow-sm"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-[#4CAF50] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#388E3C] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group"
              >
                <span className="relative z-10">{status === 'loading' ? 'Sending...' : 'Join Waitlist'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            {message && (
              <p
                className={`text-sm ${
                  status === 'success' ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-[#f0f0f0]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold text-[#4CAF50]">
              Swipy
            </h3>
            <p className="text-[#666666]">Choose restaurants together</p>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-[#666666] hover:text-[#4CAF50] transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-[#666666] hover:text-[#4CAF50] transition-colors">
              Instagram
            </Link>
            <Link href="#" className="text-[#666666] hover:text-[#4CAF50] transition-colors">
              LinkedIn
            </Link>
          </div>
        </div>
      </footer>

      {/* Early Access Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <h3 className="text-2xl font-bold mb-4 text-[#333333]">Get Early Access</h3>
            <p className="text-[#666666] mb-6">
              Be among the first to experience Swipy. Enter your email to join the waitlist.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-full border border-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] shadow-sm"
                required
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-[#4CAF50] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#388E3C] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group"
                >
                  <span className="relative z-10">{status === 'loading' ? 'Sending...' : 'Join Waitlist'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 rounded-full font-semibold border-2 border-[#f0f0f0] hover:border-[#4CAF50] transition-all transform hover:scale-105 hover:-translate-y-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
