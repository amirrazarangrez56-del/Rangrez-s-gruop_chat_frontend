import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import MembersList from '../components/MembersList';
import JoinRequestPanel from '../components/JoinRequestPanel';

export default function ChatRoom() {
  const { user } = useAuth();
  const { group, messages, isMember, hasPendingRequest, typingUsers, onlineUsers, groupLoading, fetchGroup, fetchMessages, requestJoin } = useChat();
  const navigate = useNavigate();
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchGroup(); }, [user]);
  useEffect(() => { if (isMember && group?._id) fetchMessages(group._id); }, [isMember, group?._id]);

  const handleRequestJoin = async () => {
    setJoining(true);
    try { await requestJoin(); setRequestSent(true); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setJoining(false); }
  };

  if (!user) return null;

  if (groupLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#111b21]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8696a0]">Loading...</p>
      </div>
    </div>
  );

  if (!isMember) return (
    <div className="h-screen flex items-center justify-center bg-[#111b21]">
      <div className="bg-[#1f2c34] rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border border-[#2a3942]">
        <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold text-white shadow-lg">
          {group?.name?.charAt(0).toUpperCase() || 'R'}
        </div>
        <h2 className="text-xl font-bold text-[#e9edef] mb-1">{group?.name || "Rangrez's Group"}</h2>
        <p className="text-[#8696a0] text-sm mb-2">{group?.description}</p>
        <p className="text-[#8696a0] text-sm mb-6">{group?.members?.length || 0} members</p>

        {hasPendingRequest || requestSent ? (
          <div className="bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 px-4 py-3 rounded-xl text-sm">
            ⏳ Request pending. Wait for admin approval.
          </div>
        ) : (
          <button onClick={handleRequestJoin} disabled={joining}
            className="w-full bg-[#00a884] hover:bg-[#02be9b] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {joining ? 'Sending...' : 'Request To Join'}
          </button>
        )}
        <p className="mt-4 text-xs text-[#8696a0]">Logged in as <span className="text-[#e9edef]">{user.name}</span></p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#111b21]">
      {/* Admin bar */}
      {user.isAdmin && (
        <div className="bg-[#1a2530] border-b border-[#2a3942] px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#1f2c34] transition-colors"
          onClick={() => setShowRequests(!showRequests)}>
          <span className="text-xs text-[#00a884] font-medium">Admin Panel — Join Requests & Members</span>
          <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-[#00a884] transition-transform ${showRequests ? 'rotate-180' : ''}`}><path d="M7 10l5 5 5-5z"/></svg>
        </div>
      )}
      {user.isAdmin && showRequests && (
        <div className="bg-[#111b21] border-b border-[#2a3942] px-4 py-3 max-h-60 overflow-y-auto">
          <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wide mb-2">Pending Requests</p>
          <JoinRequestPanel onRequestHandled={fetchGroup} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <ChatHeader group={group} onlineUsers={onlineUsers} onShowMembers={() => setShowMembers(!showMembers)} />
          <MessageList messages={messages} typingUsers={typingUsers} totalMembers={group?.members?.length || 0} />
          <MessageInput groupId={group?._id} />
        </div>
        {showMembers && (
          <MembersList group={group} onlineUsers={onlineUsers} onClose={() => setShowMembers(false)} onRefresh={fetchGroup} />
        )}
      </div>
    </div>
  );
}
