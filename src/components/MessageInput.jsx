import { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function MessageInput({ groupId }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendBlocked, setSendBlocked] = useState('');

  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const photoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartRef = useRef(null);

  // Listen for sendBlocked from socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('sendBlocked', ({ message }) => {
      setSendBlocked(message);
      setTimeout(() => setSendBlocked(''), 3000);
    });
    return () => socket.off('sendBlocked');
  }, []);

  // Close emoji on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    if (!typingRef.current) { typingRef.current = true; socket.emit('typing', { groupId }); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingRef.current = false; socket.emit('stopTyping', { groupId }); }, 2000);
  }, [groupId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const socket = getSocket();
    if (!socket) return;
    setSending(true);
    socket.emit('sendMessage', { groupId, messageText: trimmed });
    clearTimeout(typingTimeoutRef.current);
    typingRef.current = false;
    socket.emit('stopTyping', { groupId });
    setText('');
    setShowEmoji(false);
    if (textareaRef.current) textareaRef.current.style.height = '20px';
    setTimeout(() => setSending(false), 300);
  }, [text, groupId, sending]);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart, end = ta.selectionEnd;
      setText(text.slice(0, start) + emoji + text.slice(end));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }, 10);
    } else setText(prev => prev + emoji);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('groupId', groupId);
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd });
      if (!res.ok) { const err = await res.json(); alert(err.message || 'Upload failed'); }
    } catch { alert('Upload failed. Check Cloudinary settings.'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  // ─── VOICE RECORDING (hold to record) ───────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingStartRef.current = Date.now();
      recordingTimerRef.current = setInterval(() => setRecordingTime(Math.floor((Date.now() - recordingStartRef.current) / 1000)), 500);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone in browser settings.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        const duration = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());

        if (duration < 1) { resolve(); return; } // too short, ignore

        setUploading(true);
        try {
          const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
          const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType });
          const fd = new FormData();
          fd.append('file', file);
          fd.append('groupId', groupId);
          fd.append('messageType', 'voice');
          fd.append('duration', String(duration));
          const res = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd });
          if (!res.ok) { const err = await res.json(); alert(err.message || 'Upload failed'); }
        } catch { alert('Failed to send voice message.'); }
        finally { setUploading(false); resolve(); }
      };
      mediaRecorderRef.current.stop();
    });
  }, [isRecording, groupId]);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  }, [isRecording]);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const canSend = user?.isAdmin || user?.canSendMessages;

  if (!canSend) {
    return (
      <div className="bg-[#1f2c34] border-t border-[#2a3942] px-4 py-4 text-center">
        <p className="text-[#8696a0] text-sm">🔒 You are not allowed to send messages yet. Wait for admin approval.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2c34] border-t border-[#2a3942] px-3 py-2 relative">
      {/* Emoji Picker */}
      {showEmoji && (
        <div ref={emojiPickerRef} className="absolute bottom-16 left-3 z-50 shadow-2xl rounded-xl overflow-hidden">
          <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme="dark" skinTonesDisabled searchPlaceholder="Search..." height={360} width={310} />
        </div>
      )}

      {/* Send blocked toast */}
      {sendBlocked && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-300 text-xs px-4 py-2 rounded-full whitespace-nowrap z-50 border border-red-500/30">
          {sendBlocked}
        </div>
      )}

      {/* Recording state */}
      {isRecording ? (
        <div className="flex items-center gap-3 px-2 py-1">
          <button onClick={cancelRecording}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a3942] text-red-400 hover:bg-[#374045] transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
          <div className="flex-1 flex items-center gap-3 bg-[#2a3942] rounded-full px-4 py-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 recording-pulse" />
            <span className="text-[#e9edef] text-sm font-medium">{fmtTime(recordingTime)}</span>
            <div className="flex gap-0.5 items-center flex-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-1 bg-[#00a884] rounded-full" style={{ height: `${4 + Math.sin(i + recordingTime) * 6 + Math.random() * 4}px` }} />
              ))}
            </div>
            <span className="text-[#8696a0] text-xs">Release to send</span>
          </div>
          <button
            onMouseUp={stopRecording} onTouchEnd={stopRecording}
            className="w-11 h-11 bg-[#00a884] hover:bg-[#02be9b] rounded-full flex items-center justify-center shadow-lg flex-shrink-0 transition-colors recording-pulse">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {/* Emoji */}
          <button onClick={() => setShowEmoji(s => !s)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${showEmoji ? 'bg-[#00a884]' : 'bg-[#2a3942] hover:bg-[#374045]'}`}>
            <span className="text-xl leading-none">😊</span>
          </button>

          {/* Photo */}
          <button onClick={() => photoInputRef.current?.click()} disabled={uploading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a3942] hover:bg-[#374045] flex-shrink-0 transition-colors disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#8696a0]">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

          {/* Text input */}
          <div className="flex-1 bg-[#2a3942] rounded-3xl px-4 py-2.5 flex items-center">
            {uploading ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#8696a0]">Uploading...</span>
              </div>
            ) : (
              <textarea ref={textareaRef} rows={1} value={text}
                onChange={e => {
                  setText(e.target.value); handleTyping();
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === 'Escape') setShowEmoji(false); }}
                placeholder="Type a message"
                className="flex-1 outline-none text-sm text-[#e9edef] resize-none bg-transparent max-h-[120px] leading-5 placeholder-[#8696a0]"
                style={{ height: '20px' }} />
            )}
          </div>

          {/* Send or Voice */}
          {text.trim() ? (
            <button onClick={handleSend} disabled={sending || uploading}
              className="w-11 h-11 bg-[#00a884] hover:bg-[#02be9b] disabled:bg-[#374045] rounded-full flex items-center justify-center transition-colors shadow-md flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white ml-0.5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          ) : (
            <button
              onMouseDown={startRecording} onTouchStart={startRecording}
              onMouseUp={stopRecording} onTouchEnd={stopRecording}
              disabled={uploading}
              className="w-11 h-11 bg-[#2a3942] hover:bg-[#00a884] rounded-full flex items-center justify-center transition-colors shadow-md flex-shrink-0 disabled:opacity-50 active:bg-[#00a884] select-none"
              title="Hold to record voice message">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#8696a0] hover:fill-white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
