import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const POPULAR_LINKS = [
  { title: "AI Voice Agents", path: "/ai-voice-agent", icon: "🎙️", desc: "Automate calls with 24/7 vocal intelligence" },
  { title: "AI Chatbots", path: "/ai-chatbot", icon: "💬", desc: "Interact and capture leads on web & WhatsApp" },
  { title: "AI Receptionist", path: "/ai-phone-answering", icon: "📞", desc: "Front-desk call automation & spam filter" },
  { title: "Appointment Booking", path: "/appointment-booking", icon: "📅", desc: "Real-time calendar & booking agent" },
];

export function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to help desk with the search query
      window.location.href = `/help?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8" style={{ background: '#030812', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)', filter: 'blur(35px)' }}
        />
      </div>

      <div className="my-auto relative z-10 w-full max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[100px] sm:text-[140px] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 35px rgba(37,99,235,0.25))',
            }}
          >
            404
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 mt-4"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Lost in Space?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            The page you are looking for has been moved, renamed, or doesn't exist. Let's get you back on track!
          </p>
        </motion.div>

        {/* Search bar widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-md mx-auto"
        >
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search help articles or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-5 pr-14 py-3.5 rounded-full text-sm font-medium text-white placeholder-slate-500 transition-all duration-300 outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(37,99,235,0.4)';
                e.target.style.boxShadow = '0 0 15px rgba(37,99,235,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2)';
              }}
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-opacity duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
              }}
            >
              Search
            </button>
          </form>
        </motion.div>

        {/* Popular Services Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 text-left"
        >
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 text-center">
            Popular Services & Solutions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POPULAR_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="group p-4 rounded-2xl border no-underline transition-all duration-300 flex items-center gap-3.5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{link.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5 group-hover:text-blue-400 transition-colors duration-200">
                    {link.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-0 leading-relaxed">
                    {link.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Global CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="px-8 py-3.5 rounded-full text-sm font-bold text-white no-underline text-center transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #10B981)',
              boxShadow: '0 8px 24px -4px rgba(16,185,129,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1.5px)';
              e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(16,185,129,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(16,185,129,0.3)';
            }}
          >
            Back to Homepage
          </Link>
          <Link
            to="/pricing"
            className="px-8 py-3.5 rounded-full text-sm font-bold no-underline text-center text-slate-300 transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1.5px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1.5px)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            See Pricing Plans
          </Link>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 text-center text-xs text-slate-600 mt-12 pointer-events-none">
        &copy; {new Date().getFullYear()} Autoniv Inc. All rights reserved.
      </div>
    </div>
  );
}

export default NotFound;
