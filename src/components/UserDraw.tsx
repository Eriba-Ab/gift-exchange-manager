import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, AlertCircle } from 'lucide-react';

export default function UserDraw() {
  const [name, setName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGift, setShowGift] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      window.location.search = '?admin=true';
    }
  };

  const handleDraw = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setRecipient('');
    setShowGift(false);

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setRecipient(data.recipient);
        setShowGift(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden"
      >
        <div className="bg-indigo-600 p-6 text-white text-center relative overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBIMjBMMCAyME00MCA0MFYyMEwwIDQwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')] opacity-20 pointer-events-none"
          />
          
          <div className="relative z-10 mb-4 flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogoClick}
              className="cursor-pointer bg-white p-2 rounded-full shadow-lg w-24 h-24 flex items-center justify-center overflow-hidden"
            >
              <img 
                src="/TGGHM.png" 
                alt="Corpers Fellowship Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-indigo-600 font-bold">LOGO</span>';
                }}
              />
            </motion.div>
          </div>

          <h1 className="text-2xl font-bold relative z-10">Secret Gift Exchange</h1>
          <p className="text-indigo-100 text-sm relative z-10">Enter your name to reveal your match!</p>
        </div>

        <div className="p-6 space-y-6">
          {!showGift ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. John Doe"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDraw(); } }}
                  />
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDraw}
                disabled={loading || !name.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Reveal My Match <Sparkles className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mb-2 text-gray-500 font-medium uppercase tracking-wider text-xs">
                You are gifting to
              </div>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="text-4xl font-bold text-indigo-600 mb-6 break-words"
              >
                {recipient}
              </motion.div>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowGift(false);
                  setName('');
                  setRecipient('');
                }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Start Over
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
