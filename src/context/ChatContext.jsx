import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groupLoading, setGroupLoading] = useState(false);
  const typingTimeouts = useRef({});

  const fetchGroup = useCallback(async () => {
    if (!user) return;
    setGroupLoading(true);
    try {
      const { data } = await api.get('/group');
      setGroup(data.group);
      setIsMember(data.isMember);
      setHasPendingRequest(data.hasPendingRequest);
    } catch (err) { console.error(err); }
    finally { setGroupLoading(false); }
  }, [user]);

  const fetchMessages = useCallback(async (groupId) => {
    try {
      const { data } = await api.get(`/messages/${groupId}`);
      setMessages(data.messages);
    } catch (err) { console.error(err); }
  }, []);

  const requestJoin = useCallback(async () => {
    await api.post('/group/request-join');
    setHasPendingRequest(true);
  }, []);

  useEffect(() => {
    if (!user || !isMember || !group) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('joinGroup', { groupId: group._id });

    const onNewMessage = (msg) => {
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      socket.emit('messageDelivered', { messageId: msg._id });
    };
    const onMessageDeleted = ({ messageId }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true } : m));
    const onDeliveryUpdate = ({ messageId, deliveredTo }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deliveredTo } : m));
    const onSeenUpdate = ({ messageIds, seenBy }) =>
      setMessages(prev => prev.map(m => messageIds.includes(m._id) ? { ...m, seenBy: [...new Set([...(m.seenBy || []), seenBy])] } : m));
    const onUserTyping = ({ userId, userName }) => {
      if (userId === user._id) return;
      setTypingUsers(prev => prev.find(u => u.userId === userId) ? prev : [...prev, { userId, userName }]);
      clearTimeout(typingTimeouts.current[userId]);
      typingTimeouts.current[userId] = setTimeout(() => setTypingUsers(prev => prev.filter(u => u.userId !== userId)), 3000);
    };
    const onUserStoppedTyping = ({ userId }) => setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    const onUserOnline = ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId]));
    const onUserOffline = ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    const onMemberRemoved = ({ userId: rid }) => {
      if (rid === user._id) { setIsMember(false); setGroup(null); setMessages([]); }
      else setGroup(prev => prev ? { ...prev, members: prev.members.filter(m => (m._id || m) !== rid) } : prev);
    };
    const onMemberPermissionUpdated = ({ userId: uid, canSendMessages }) => {
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members.map(m => (m._id || m) === uid ? { ...m, canSendMessages } : m)
      } : prev);
    };

    socket.on('newMessage', onNewMessage);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('deliveryUpdate', onDeliveryUpdate);
    socket.on('seenUpdate', onSeenUpdate);
    socket.on('userTyping', onUserTyping);
    socket.on('userStoppedTyping', onUserStoppedTyping);
    socket.on('userOnline', onUserOnline);
    socket.on('userOffline', onUserOffline);
    socket.on('memberRemoved', onMemberRemoved);
    socket.on('memberPermissionUpdated', onMemberPermissionUpdated);
    socket.emit('markMessagesSeen', { groupId: group._id });

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messageDeleted', onMessageDeleted);
      socket.off('deliveryUpdate', onDeliveryUpdate);
      socket.off('seenUpdate', onSeenUpdate);
      socket.off('userTyping', onUserTyping);
      socket.off('userStoppedTyping', onUserStoppedTyping);
      socket.off('userOnline', onUserOnline);
      socket.off('userOffline', onUserOffline);
      socket.off('memberRemoved', onMemberRemoved);
      socket.off('memberPermissionUpdated', onMemberPermissionUpdated);
    };
  }, [user, isMember, group]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    socket.on('requestApproved', () => fetchGroup());
    socket.on('requestRejected', () => setHasPendingRequest(false));
    socket.on('removedFromGroup', () => { setIsMember(false); setGroup(null); setMessages([]); });
    socket.on('sendPermissionChanged', ({ canSendMessages }) => updateUser({ canSendMessages }));
    return () => {
      socket.off('requestApproved');
      socket.off('requestRejected');
      socket.off('removedFromGroup');
      socket.off('sendPermissionChanged');
    };
  }, [user, fetchGroup, updateUser]);

  return (
    <ChatContext.Provider value={{ group, setGroup, messages, isMember, hasPendingRequest, typingUsers, onlineUsers, groupLoading, fetchGroup, fetchMessages, requestJoin }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
};
