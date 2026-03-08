import { useAuth } from '../context/AuthContext';

export default function ChatHeader({ group, onlineUsers, onShowMembers }) {
  const { logout } = useAuth();
  const onlineCount = group?.members?.filter(m => onlineUsers.has(m._id || m)).length || 0;

  return (
    <div className="bg-[#1f2c34] text-[#e9edef] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onShowMembers}>
        <div className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-white font-bold text-lg shadow">
          {group?.name?.charAt(0).toUpperCase() || 'R'}
        </div>
        <div>
          <h2 className="font-semibold text-[#e9edef] leading-tight">{group?.name}</h2>
          <p className="text-xs text-[#8696a0]">
            {group?.members?.length || 0} members{onlineCount > 0 && ` · ${onlineCount} online`}
          </p>
        </div>
      </div>
      <button onClick={logout} className="p-2 rounded-lg hover:bg-[#2a3942] transition-colors" title="Logout">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#8696a0]">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
      </button>
    </div>
  );
}
