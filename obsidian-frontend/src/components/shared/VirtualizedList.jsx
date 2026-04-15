import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

// Virtualized list component for large datasets
function VirtualizedList({ 
  items = [], 
  itemHeight = 60, 
  height = 400, 
  renderItem, 
  loading = false,
  loadingComponent = null,
  emptyMessage = "No items to display"
}) {
  const memoizedItems = useMemo(() => items, [items]);

  if (loading) {
    return loadingComponent || (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: `${height}px`,
        color: '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  if (!memoizedItems.length) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: `${height}px`,
        color: '#6B7280'
      }}>
        {emptyMessage}
      </div>
    );
  }

  const Row = ({ index, style }) => {
    const item = memoizedItems[index];
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={memoizedItems.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5} // Render 5 extra items above/below for smooth scrolling
    >
      {Row}
    </List>
  );
}

// Virtualized conversation list for messages
export function VirtualizedConversationList({ 
  conversations = [], 
  onSelectConversation, 
  activeConversationId,
  loading = false 
}) {
  const renderItem = (conversation, index) => {
    const isActive = conversation.partner.user_id === activeConversationId;
    const unreadCount = conversation.unreadCount || 0;
    
    return (
      <div
        className={`p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors ${
          isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={() => onSelectConversation(conversation)}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            {conversation.partner.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {conversation.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {conversation.partner.name}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(conversation.lastMessageTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage?.text || 'No messages yet'}
            </p>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <VirtualizedList
      items={conversations}
      itemHeight={80}
      height={600}
      renderItem={renderItem}
      loading={loading}
      loadingComponent={
        <div className="p-4 text-center text-gray-500">
          Loading conversations...
        </div>
      }
      emptyMessage="No conversations yet"
    />
  );
}

// Virtualized message list for chat
export function VirtualizedMessageList({ 
  messages = [], 
  currentUserId,
  loading = false,
  onReply,
  onDelete,
  onContextMenu
}) {
  const renderItem = (message, index) => {
    const isMine = message.sender === currentUserId;
    
    return (
      <div
        className={`flex ${isMine ? 'justify-end' : 'justify-start'} p-2`}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, message)}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
          } ${message.deleted ? 'opacity-50 italic' : ''}`}
        >
          {message.replyTo && (
            <div className="text-xs opacity-75 mb-1 border-l-2 border-current pl-2">
              <div className="font-semibold">
                Reply to: {message.replyTo.senderName}
              </div>
              <div>{message.replyTo.text?.slice(0, 50)}...</div>
            </div>
          )}
          
          {message.image && (
            <img 
              src={message.image} 
              alt="Shared image" 
              className="rounded mb-2 max-w-full"
            />
          )}
          
          <p className="text-sm">
            {message.deleted ? 'This message was deleted' : message.text}
          </p>
          
          <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
            isMine ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.created_at)}</span>
            {isMine && <MessageTick status={message.status} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <VirtualizedList
      items={messages}
      itemHeight={100}
      height={500}
      renderItem={renderItem}
      loading={loading}
      emptyMessage="No messages yet. Start the conversation!"
    />
  );
}

// Message status tick component
function MessageTick({ status }) {
  if (status === 'seen') {
    return (
      <span className="text-blue-200" title="Seen">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" transform="translate(6, 0)"/>
        </svg>
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="text-blue-100" title="Delivered">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" transform="translate(6, 0)"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="text-blue-100" title="Sent">
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </span>
  );
}

// Helper function to format time
function formatTime(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const diffInHours = (now - msgDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return msgDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  return msgDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export default VirtualizedList;
