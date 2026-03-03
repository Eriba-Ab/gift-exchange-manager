import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Users, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [names, setNames] = useState('');
  const [matches, setMatches] = useState<{ giver: string; receiver: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    setLoading(true);
    setMessage('');
    try {
      const nameList = names.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      if (nameList.length < 2) {
        setMessage('Please enter at least 2 names.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: nameList }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully uploaded ${data.count} participants! Database reset.`);
        setNames('');
        setMatches([]);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/admin/matches');
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Admin Setup
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Participants (One per line)
        </label>
        <textarea
          className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
          value={names}
          onChange={(e) => setNames(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleUpload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload & Reset
        </button>
        
        <button
          onClick={fetchMatches}
          className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          View Matches
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
        >
          {message}
        </motion.div>
      )}

      {matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 border-t pt-4"
        >
          <h3 className="font-medium mb-2">Current Matches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {matches.map((m, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded flex justify-between">
                <span className="font-medium">{m.giver}</span>
                <span className="text-gray-400">→</span>
                <span className="text-indigo-600 font-medium">{m.receiver || '(Pending)'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
