import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchApi } from '../../hooks/useFetch';
import useAuth from '../../hooks/useAuth';
import useChatStore from '../../store/useChatStore';
import useSocket from '../../hooks/useSocket';
import { Search, Send, MoreVertical, Reply, Trash2, Check, CheckCheck, ArrowLeft } from 'lucide-react';

function MessageTick({ status }) {
  if (status === 'seen') {
    return <CheckCheck size={16} color="#3b82f6" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={16} color="#9ca3af" />;
  }
  return <Check size={16} color="#9ca3af" />;
}

function MessageBubble({ message, isMine, onReply, onDelete, onContextMenu }) {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`msg-bubble-wrapper ${isMine ? 'msg-mine' : 'msg-theirs'}`}>
      <div 
        className={`msg-bubble ${isMine ? 'bg-mine' : 'bg-theirs'} ${message.deleted ? 'msg-deleted' : ''}`}
        onContextMenu={onContextMenu}
      >
        {message.replyTo && (
          <div className="msg-reply-ref">
            <div className="msg-reply-sender">Reply to: {message.replyTo.senderName}</div>
            <div className="msg-reply-text">{message.replyTo.text?.slice(0, 50)}...</div>
          </div>
        )}
        
        {message.image && (
          <img src={message.image} alt="Shared" className="msg-image" />
        )}
        
        <p className="msg-text">
          {message.deleted ? 'This message was deleted' : message.text}
        </p>
        
        <div className={`msg-meta ${isMine ? 'meta-mine' : 'meta-theirs'}`}>
          <span>{formatTime(message.created_at)}</span>
          {isMine && <MessageTick status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isActive, onClick, unreadCount }) {
  const { onlineUsers } = useChatStore();
  const isOnline = onlineUsers.includes(conversation.partner.user_id);
  
  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffInHours = (now - msgDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`conv-item ${isActive ? 'conv-active' : ''}`} onClick={onClick}>
      <div className="conv-avatar-wrapper">
        <div className="conv-avatar">
          {conversation.partner.name?.[0]?.toUpperCase() || 'U'}
        </div>
        {isOnline && <div className="conv-online-indicator" />}
      </div>
      
      <div className="conv-details">
        <div className="conv-header">
          <h3 className="conv-name">{conversation.partner.name}</h3>
          <span className="conv-time">{formatTime(conversation.lastMessageTime)}</span>
        </div>
        
        <div className="conv-footer">
          <p className="conv-last-msg">
            {conversation.lastMessage?.text || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="conv-unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Messages() {
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const {
    onlineUsers,
    messages,
    selectedUserId,
    conversations,
    typingUsers,
    setSelectedUserId,
    setMessages,
    addMessage,
    setConversations,
    updateUnreadCount,
    markMessageDeleted,
    sendMessage,
    markAsSeen,
    startTyping,
    stopTyping,
    deleteMessage
  } = useChatStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [notification, setNotification] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useSocket();

  const showNotification = useCallback((message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingConversations(true);
    try {
      const data = await fetchApi('/messages/conversations');
      if (Array.isArray(data)) {
         setConversations(data);
         const unreadMap = {};
         data.forEach(conv => {
           unreadMap[conv.partner.user_id] = conv.unreadCount || 0;
         });
         updateUnreadCount(unreadMap);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // showNotification('Failed to load conversations'); // Hide overly aggressive errors
    }
    setLoadingConversations(false);
  }, [user?.id, setConversations, updateUnreadCount, showNotification]);

  const fetchMessages = useCallback(async (userId) => {
    if (!user?.id || !userId) return;
    
    setLoading(true);
    try {
      const data = await fetchApi(`/messages/${userId}`);
      if(Array.isArray(data)) {
        setMessages(data);
        markAsSeen(userId);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      showNotification('Failed to load messages');
    }
    setLoading(false);
  }, [user?.id, setMessages, markAsSeen, showNotification]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUserId) return;

    const messageData = {
      sender: user.id,
      receiver: selectedUserId,
      text: text.trim(),
      replyTo: replyTo?.id
    };

    try {
      const data = await fetchApi('/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      
      addMessage(data);
      setText('');
      setReplyTo(null);
      fetchConversations();
      sendMessage(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      showNotification('Failed to send message');
    }
  }, [text, selectedUserId, user?.id, replyTo, addMessage, fetchConversations, sendMessage, showNotification]);

  const handleReply = useCallback((message) => {
    setReplyTo({
      id: message.id,
      text: message.text,
      senderName: message.senderProfile?.name || 'Unknown'
    });
    setContextMenu(null);
    inputRef.current?.focus();
  }, []);

  const handleDelete = useCallback((messageId, deleteType) => {
    deleteMessage(messageId, deleteType);
    if (deleteType === 'everyone') {
      markMessageDeleted(messageId);
    }
    setContextMenu(null);
  }, [deleteMessage, markMessageDeleted]);

  const handleContextMenu = useCallback((e, message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (paramUserId) {
      setSelectedUserId(paramUserId);
      fetchMessages(paramUserId);
      setShowMobileChat(true);
    }
  }, [paramUserId, setSelectedUserId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (selectedUserId) {
      startTyping(selectedUserId);
      setTimeout(() => stopTyping(selectedUserId), 1000);
    }
  };

  if (!user) {
    return (
      <div className="msg-login-prompt">
        <div className="msg-login-card">
          <h2>Please login to access messages</h2>
          <button onClick={() => navigate('/auth')}>Login</button>
        </div>
      </div>
    );
  }

  const filteredConversations = (conversations || []).filter(conv =>
    conv?.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTyping = typingUsers.has(selectedUserId);
  const activeConversation = (conversations || []).find(conv => conv?.partner?.user_id === selectedUserId);

  return (
    <>
      <style>{`
        .msg-layout {
          display: flex;
          height: 100%;
          width: 100%;
          background: #f9fafb;
          font-family: inherit;
        }

        /* Sidebar Contacts */
        .msg-sidebar {
          width: 320px;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        
        .msg-sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .msg-sidebar-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .msg-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .msg-search-box svg {
          position: absolute;
          left: 12px;
          color: #9ca3af;
        }

        .msg-search-box input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .msg-search-box input:focus {
          border-color: #6366f1;
        }

        .msg-conv-list {
          flex: 1;
          overflow-y: auto;
        }

        .conv-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s;
        }

        .conv-item:hover {
          background: #f9fafb;
        }

        .conv-active {
          background: #eff6ff !important;
          border-left: 4px solid #3b82f6;
          padding-left: 12px; /* Adjust for border */
        }

        .conv-avatar-wrapper {
          position: relative;
          margin-right: 16px;
        }

        .conv-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
        }

        .conv-online-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 14px;
          height: 14px;
          background: #10b981;
          border: 2px solid #fff;
          border-radius: 50%;
        }

        .conv-details {
          flex: 1;
          min-width: 0;
        }

        .conv-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }

        .conv-name {
          font-weight: 600;
          color: #111827;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-time {
          font-size: 12px;
          color: #6b7280;
        }

        .conv-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conv-last-msg {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          padding-right: 8px;
        }

        .conv-unread-badge {
          background: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        /* Chat Area */
        .msg-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
        }

        .msg-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .chat-header-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }
        
        .chat-header-info p {
          font-size: 13px;
          color: #6b7280;
        }

        .msg-chat-history {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #f3f4f6;
          display: flex;
          flex-direction: column;
        }

        /* Message Bubbles */
        .msg-bubble-wrapper {
          display: flex;
          margin-bottom: 16px;
        }

        .msg-mine {
          justify-content: flex-end;
        }
        
        .msg-theirs {
          justify-content: flex-start;
        }

        .msg-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .bg-mine {
          background: #6366f1;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .bg-theirs {
          background: #fff;
          color: #1f2937;
          border-bottom-left-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .msg-deleted {
          opacity: 0.6;
          font-style: italic;
        }

        .msg-text {
          font-size: 14px;
          line-height: 1.5;
        }

        .msg-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          margin-top: 6px;
          justify-content: flex-end;
        }

        .meta-mine {
          color: rgba(255,255,255,0.7);
        }
        
        .meta-theirs {
          color: #9ca3af;
        }

        .msg-reply-ref {
          font-size: 12px;
          margin-bottom: 8px;
          padding-left: 8px;
          border-left: 2px solid currentColor;
          opacity: 0.8;
        }

        .msg-reply-sender {
          font-weight: 600;
          margin-bottom: 2px;
        }

        /* Input Area */
        .msg-input-area {
          background: #fff;
          border-top: 1px solid #e5e7eb;
          padding: 16px 24px;
        }

        .msg-reply-bar {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-radius: 4px;
        }

        .reply-bar-close {
          color: #3b82f6;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }

        .msg-form {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .msg-form input {
          flex: 1;
          padding: 12px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          outline: none;
          font-size: 15px;
          transition: border-color 0.2s;
          background: #f9fafb;
        }
        
        .msg-form input:focus {
          border-color: #6366f1;
          background: #fff;
        }

        .msg-form button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #6366f1;
          color: #fff;
          border: none;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }

        .msg-form button:hover:not(:disabled) {
          background: #4f46e5;
        }

        .msg-form button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Empty States */
        .msg-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        .msg-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          margin-bottom: 20px;
        }

        .msg-empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .msg-empty-state p {
          color: #6b7280;
          font-size: 15px;
        }

        /* Context Menu */
        .msg-context-menu {
          position: fixed;
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-radius: 8px;
          padding: 8px 0;
          z-index: 100;
          min-width: 180px;
        }

        .msg-context-menu button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: background 0.2s;
        }

        .msg-context-menu button:hover {
          background: #f3f4f6;
        }

        .msg-context-menu .btn-danger {
          color: #ef4444;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 13px;
          padding: 8px 16px;
        }
        
        .typing-dots {
          display: flex;
          gap: 3px;
        }
        
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typeBounce 1.4s infinite ease-in-out both;
        }
        
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typeBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>

      <div className="msg-layout">
        {contextMenu && (
          <div
            className="msg-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={() => handleReply(contextMenu.message)}>
              <Reply size={16} /> Reply
            </button>
            {contextMenu.message.sender === user.id && (
              <button
                className="btn-danger"
                onClick={() => handleDelete(contextMenu.message.id, 'everyone')}
              >
                <Trash2 size={16} /> Delete for Everyone
              </button>
            )}
            <button
              onClick={() => handleDelete(contextMenu.message.id, 'me')}
            >
              <Trash2 size={16} /> Delete for Me
            </button>
          </div>
        )}

        {/* Sidebar */}
        <div className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h2>Messages</h2>
            <div className="msg-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="msg-conv-list">
            {loadingConversations ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.partner.user_id}
                  conversation={conversation}
                  isActive={selectedUserId === conversation.partner.user_id}
                  onClick={() => {
                    setSelectedUserId(conversation.partner.user_id);
                    fetchMessages(conversation.partner.user_id);
                    setShowMobileChat(true);
                  }}
                  unreadCount={conversation.unreadCount}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUserId ? (
          <div className="msg-chat-area">
            <div className="msg-chat-header">
              <div className="chat-header-info">
                <div className="conv-avatar">
                  {activeConversation?.partner?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3>{activeConversation?.partner?.name || 'User'}</h3>
                  <p>{onlineUsers.includes(selectedUserId) ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="msg-chat-history">
              {loading ? (
                <div style={{ textAlign: "center", color: "#6b7280", marginTop: "20px" }}>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6b7280", margin: "auto" }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={message.sender === user.id}
                      onReply={() => handleReply(message)}
                      onDelete={(type) => handleDelete(message.id, type)}
                      onContextMenu={(e) => handleContextMenu(e, message)}
                    />
                  ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                      <span>typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="msg-input-area">
              {replyTo && (
                <div className="msg-reply-bar">
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#3b82f6" }}>
                      Replying to {replyTo.senderName}
                    </div>
                    <div style={{ fontSize: "13px", color: "#1d4ed8" }}>
                      {replyTo.text}
                    </div>
                  </div>
                  <button className="reply-bar-close" onClick={() => setReplyTo(null)}>×</button>
                </div>
              )}
              
              <form className="msg-form" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                />
                <button type="submit" disabled={!text.trim() && !loading}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="msg-empty-state">
            <div className="msg-empty-icon">
              <Send size={40} />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose from your existing conversations or start a new one.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(Messages);
