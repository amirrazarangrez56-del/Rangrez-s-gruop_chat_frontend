import { useState } from 'react';
import { format } from 'date-fns';
import TickMark from './TickMark';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function VoicePlayer({ fileUrl, duration }) {
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => new Audio(fileUrl));
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (playing) { audio.pause(); setPlaying(false); }
    else {
      audio.play();
      setPlaying(true);
      audio.ontimeupdate = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      audio.onended = () => { setPlaying(false); setProgress(0); };
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 py-1 min-w-[180px]">
      <button onClick={toggle}
        className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#02be9b] transition-colors">
        {playing
          ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>
      <div className="flex-1">
        <div className="h-1 bg-[#374045] rounded-full overflow-hidden">
          <div className="h-full bg-[#00a884] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-[#8696a0] mt-0.5">{fmt(duration || 0)}</p>
      </div>
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#8696a0] flex-shrink-0">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    </div>
  );
}

export default function MessageBubble({ message, totalMembers }) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isMe = message.senderId?._id === user._id || message.senderId === user._id;
  if (message.deleted) return null;

  const handleDelete = async () => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try { await api.delete(`/messages/delete/${message._id}`); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setShowMenu(false);
  };

  const renderContent = () => {
    if (message.messageType === 'image') return (
      <img src={message.fileUrl} alt="photo"
        onClick={() => window.open(message.fileUrl, '_blank')}
        className="rounded-xl max-w-[220px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity" />
    );
    if (message.messageType === 'voice') return <VoicePlayer fileUrl={message.fileUrl} duration={message.duration} />;
    if (message.messageType === 'audio') return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-xl">🎵</span>
        <audio controls className="max-w-[180px] h-8" style={{ minWidth: '160px' }}>
          <source src={message.fileUrl} />
        </audio>
      </div>
    );
    return <p className="text-sm leading-relaxed text-[#e9edef]">{message.messageText}</p>;
  };

  return (
    <div className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`message-bubble relative group ${
        isMe ? 'bg-[#005c4b] rounded-tl-2xl rounded-bl-2xl rounded-tr-sm rounded-br-2xl'
              : 'bg-[#1f2c34] rounded-tr-2xl rounded-br-2xl rounded-tl-sm rounded-bl-2xl'
      } px-3 py-2 shadow-sm`}>

        {!isMe && (
          <p className="text-xs font-semibold text-[#00a884] mb-1">
            {message.senderId?.name || 'Unknown'}
            {message.senderId?.isAdmin && <span className="ml-1 text-[9px] bg-[#00a884] text-white px-1.5 py-0.5 rounded-full">Admin</span>}
          </p>
        )}

        {renderContent()}

        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#8696a0]">{format(new Date(message.createdAt), 'HH:mm')}</span>
          {isMe && <TickMark deliveredTo={message.deliveredTo || []} seenBy={message.seenBy || []} totalMembers={totalMembers} />}
        </div>

        {/* Only admin sees delete button */}
        {user.isAdmin && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowMenu(s => !s)}
              className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-[#8696a0] hover:bg-black/50">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                <path d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-[#233138] rounded-lg shadow-2xl border border-[#374045] z-50 min-w-[120px] overflow-hidden">
                <button onClick={handleDelete}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a3942]">
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
