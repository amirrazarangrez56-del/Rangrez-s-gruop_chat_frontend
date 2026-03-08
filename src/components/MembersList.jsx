import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function MembersList({ group, onlineUsers, onClose, onRefresh }) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(null);

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName}?`)) return;
    setProcessing(memberId);
    try { await api.delete(`/group/remove/${memberId}`); onRefresh?.(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const handleToggleSend = async (memberId) => {
    setProcessing(memberId);
    try { await api.post(`/group/toggle-send/${memberId}`); onRefresh?.(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="w-72 bg-[#111b21] border-l border-[#2a3942] flex flex-col h-full">
      <div className="bg-[#1f2c34] text-[#e9edef] px-4 py-4 flex items-center justify-between border-b border-[#2a3942]">
        <h3 className="font-semibold text-[#e9edef]">Members ({group?.members?.length || 0})</h3>
        <button onClick={onClose} className="hover:bg-[#2a3942] rounded-full p-1.5 transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#8696a0]"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div className="px-4 py-3 bg-[#1a2530] border-b border-[#2a3942]">
        <p className="text-xs text-[#8696a0] uppercase tracking-wide mb-1">Description</p>
        <p className="text-sm text-[#e9edef]">{group?.description || 'No description'}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {group?.members?.map(member => {
          const memberId = member._id || member;
          const isOnline = onlineUsers.has(memberId);
          const isGroupAdmin = memberId === (group.admin?._id || group.admin);
          const isSelf = memberId === user._id;
          const canSend = member.canSendMessages || isGroupAdmin;

          return (
            <div key={memberId} className="px-4 py-3 border-b border-[#1f2c34] hover:bg-[#1f2c34] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center text-[#00a884] font-semibold text-sm">
                    {(member.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${isOnline ? 'bg-green-400' : 'bg-[#374045]'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e9edef] truncate">
                    {member.name || 'Unknown'}
                    {isSelf && <span className="text-[#8696a0] ml-1 font-normal text-xs">(you)</span>}
                  </p>
                  <p className="text-xs text-[#8696a0]">
                    {isGroupAdmin ? '⭐ Admin' : isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Admin controls for non-admin members */}
              {user.isAdmin && !isSelf && !isGroupAdmin && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-[#2a3942]">
                  {/* Toggle send permission */}
                  <button
                    onClick={() => handleToggleSend(memberId)}
                    disabled={processing === memberId}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      canSend
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-600/30'
                        : 'bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 border border-[#00a884]/30'
                    }`}>
                    {canSend ? '🔇 Mute' : '🔊 Allow'}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(memberId, member.name)}
                    disabled={processing === memberId}
                    className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-900/30 transition-colors disabled:opacity-50">
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Send status badge for non-admin non-self */}
              {!isGroupAdmin && !isSelf && !user.isAdmin && (
                <p className="text-[10px] text-[#8696a0] mt-1">
                  {canSend ? '🔊 Can send' : '🔇 Muted by admin'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
