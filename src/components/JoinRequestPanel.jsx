import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

export default function JoinRequestPanel({ onRequestHandled }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get('/group/join-requests').then(({ data }) => setRequests(data.joinRequests || [])).catch(console.error).finally(() => setLoading(false));
    const socket = getSocket();
    if (socket) {
      socket.on('joinRequestNotification', (data) => {
        setRequests(prev => prev.find(r => r._id === data.userId) ? prev : [...prev, { _id: data.userId, name: data.userName, email: data.userEmail }]);
      });
    }
    return () => { socket?.off('joinRequestNotification'); };
  }, []);

  const approve = async (userId) => {
    setProcessing(userId);
    try { await api.post(`/group/approve/${userId}`); setRequests(p => p.filter(r => r._id !== userId)); onRequestHandled?.(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const reject = async (userId) => {
    setProcessing(userId);
    try { await api.post(`/group/reject/${userId}`); setRequests(p => p.filter(r => r._id !== userId)); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  if (loading) return <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" /></div>;
  if (!requests.length) return <div className="text-center py-6 text-[#8696a0] text-sm">✅ No pending requests</div>;

  return (
    <div className="space-y-2">
      {requests.map(req => (
        <div key={req._id} className="flex items-center gap-3 p-3 bg-[#2a3942] rounded-xl border border-[#374045]">
          <div className="w-9 h-9 bg-[#374045] rounded-full flex items-center justify-center text-[#00a884] font-bold text-sm flex-shrink-0">
            {(req.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#e9edef] text-sm truncate">{req.name}</p>
            <p className="text-xs text-[#8696a0] truncate">{req.email}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => approve(req._id)} disabled={processing === req._id}
              className="px-2.5 py-1 bg-[#00a884] text-white text-xs font-semibold rounded-lg hover:bg-[#02be9b] disabled:opacity-60 transition-colors">✓</button>
            <button onClick={() => reject(req._id)} disabled={processing === req._id}
              className="px-2.5 py-1 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
