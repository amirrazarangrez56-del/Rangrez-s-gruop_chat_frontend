import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, typingUsers, totalMembers }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUsers]);

  const groupByDate = (msgs) => {
    const g = {};
    msgs.forEach(m => { const d = new Date(m.createdAt).toDateString(); if (!g[d]) g[d] = []; g[d].push(m); });
    return g;
  };

  const dateLabel = (str) => {
    const d = new Date(str), today = new Date(), yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (!messages.length) return (
    <div className="flex-1 flex items-center justify-center chat-bg">
      <div className="text-center">
        <div className="text-5xl mb-3">💬</div>
        <p className="text-[#8696a0] font-medium">No messages yet</p>
        <p className="text-[#4a5568] text-sm">Be the first to say something!</p>
      </div>
    </div>
  );

  const grouped = groupByDate(messages);
  return (
    <div className="flex-1 overflow-y-auto chat-bg px-3 py-2">
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex justify-center my-3">
            <span className="bg-[#1f2c34]/90 text-[#8696a0] text-xs px-3 py-1 rounded-full shadow-sm border border-[#2a3942]">
              {dateLabel(date)}
            </span>
          </div>
          {msgs.map(msg => <MessageBubble key={msg._id} message={msg} totalMembers={totalMembers} />)}
        </div>
      ))}

      {typingUsers.length > 0 && (
        <div className="flex justify-start mb-2">
          <div className="bg-[#1f2c34] rounded-2xl px-4 py-2 shadow-sm border border-[#2a3942]">
            <p className="text-xs text-[#8696a0] italic">
              {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
            <div className="flex gap-1 mt-1">
              {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
