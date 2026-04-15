import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../hooks/useFetch";
import useAuth from "../../hooks/useAuth";
import { 
  Search, MoreVertical, Send, Paperclip, X, Users, 
  LogOut, Plus, MessageSquare, Info
} from "lucide-react";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle sidebar resize with useCallback
  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  async function loadCommunities() {
    try {
      const data = await fetchApi("/communities");
      const formatted = data.communities.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || "common",
        members: c.members || [],
        unreadCount: 0,
        lastMessage: "Click to view messages",
        timestamp: "Now",
        avatar: c.name.charAt(0).toUpperCase()
      }));
      setCommunities(formatted);
    } catch (err) {
      console.error("Failed to load communities", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(communityId) {
    try {
      console.log('Loading messages for community:', communityId);
      const data = await fetchApi(`/communities/${communityId}/messages`);
      console.log('Received messages:', data);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      console.log('Sending message to community:', selectedChat.id, 'Body:', messageInput);
      const response = await fetchApi(`/communities/${selectedChat.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: messageInput })
      });
      console.log('Message sent successfully:', response);
      setMessageInput("");
      
      // Reload messages to show the new one
      await loadMessages(selectedChat.id);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert('Failed to send message: ' + err.message);
    }
  }

  async function handleLeaveCommunity(communityId) {
    if (!confirm("Are you sure you want to leave this community?")) return;
    
    try {
      await fetchApi(`/communities/${communityId}/leave`, {
        method: "POST"
      });
      alert("Successfully left the community");
      setSelectedChat(null);
      setShowChatInfo(false);
      await loadCommunities(); // Reload community list
    } catch (err) {
      alert(err.message || "Failed to leave community");
    }
  }

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 56px)",
      background: "#F0F2F5"
    }}>
      {/* 1️⃣ LEFT SIDEBAR - CHATS LIST */}
      {!isSidebarCollapsed && (
        <div style={{
          width: `${sidebarWidth}px`,
          background: "#fff",
          borderRight: "1px solid #E9EDEF",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transition: "width 0.3s ease"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px",
            background: "#F0F2F5",
            borderBottom: "1px solid #E9EDEF"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h2 style={{
                fontSize: "19px",
                fontWeight: "600",
                color: "#111B21",
                margin: 0
              }}>
                Chats
              </h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  style={{
                    ...iconButtonStyle,
                    color: "#54656F"
                  }}
                  title="Collapse sidebar"
                >
                  <X size={20} />
                </button>
                <button style={iconButtonStyle}>
                  <Plus size={20} />
                </button>
                <button style={iconButtonStyle}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={searchBarStyle}>
              <Search size={15} color="#667781" style={{ marginLeft: "12px" }} />
              <input
                type="text"
                placeholder="Search chats or people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>

          {/* Chat List */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            background: "#fff"
          }}>
            {filteredCommunities.length === 0 ? (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#667781",
                fontSize: "14px"
              }}>
                No chats found
              </div>
            ) : (
              filteredCommunities.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                />
              ))
            )}
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            style={{
              position: "absolute",
              top: 0,
              right: -6,
              width: "12px",
              height: "100%",
              cursor: "col-resize",
              background: isResizing ? "#25D366" : "rgba(37, 211, 102, 0.1)",
              transition: "background 0.2s",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px"
            }}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.background = "rgba(37, 211, 102, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.background = "rgba(37, 211, 102, 0.1)";
              }
            }}
          >
            {/* Grip Lines */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              pointerEvents: "none"
            }}>
              <div style={{ width: "2px", height: "4px", background: "#25D366", borderRadius: "1px" }} />
              <div style={{ width: "2px", height: "4px", background: "#25D366", borderRadius: "1px" }} />
              <div style={{ width: "2px", height: "4px", background: "#25D366", borderRadius: "1px" }} />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Sidebar Toggle Button */}
      {isSidebarCollapsed && (
        <div style={{
          width: "60px",
          background: "#F0F2F5",
          borderRight: "1px solid #E9EDEF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0"
        }}>
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            style={{
              ...iconButtonStyle,
              background: "#25D366",
              color: "#fff",
              padding: "12px",
              marginBottom: "8px"
            }}
            title="Expand sidebar"
          >
            <MessageSquare size={24} />
          </button>
          <div style={{
            width: "30px",
            height: "1px",
            background: "#E9EDEF",
            margin: "8px 0"
          }} />
          <button style={{...iconButtonStyle, padding: "12px"}}>
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* 2️⃣ MIDDLE - CHAT VIEW */}
      {selectedChat ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#EFEAE2"
        }}>
          {/* Chat Header */}
          <div style={{
            height: "60px",
            background: "#F0F2F5",
            borderBottom: "1px solid #E9EDEF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "600",
                fontSize: "16px"
              }}>
                {selectedChat.avatar}
              </div>
              <div>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  color: "#111B21",
                  margin: 0
                }}>
                  {selectedChat.name}
                </h3>
                <span style={{
                  fontSize: "12px",
                  color: "#667781"
                }}>
                  {selectedChat.members.length} members
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              <button style={iconButtonStyle}>
                <Search size={20} />
              </button>
              <button 
                style={iconButtonStyle}
                onClick={() => setShowChatInfo(!showChatInfo)}
              >
                <Info size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDEwMHYxMDBIMHoiIGZpbGw9IiNlZmVhZTIiLz48cGF0aCBkPSJNNTAgNTBtLTIwIDAgYTIwLDIwIDAgMSwwIDQwLDAgYTIwLDIwIDAgMSwwIC00MCwwIiBmaWxsPSJub25lIiBzdHJva2U9IiNkOWQyYzQiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iLjEiLz48L3N2Zz4=')",
            backgroundSize: "100px 100px"
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#667781"
              }}>
                <MessageSquare size={64} opacity={0.2} />
                <p style={{ marginTop: "16px", fontSize: "14px" }}>
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message Composer */}
          <div style={{
            padding: "10px 16px",
            background: "#F0F2F5",
            borderTop: "1px solid #E9EDEF",
            display: "flex",
            gap: "8px",
            alignItems: "center"
          }}>
            <button style={{
              ...iconButtonStyle,
              padding: "10px"
            }}>
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              placeholder="Type a message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#fff",
                fontSize: "15px",
                color: "#111B21",
                outline: "none"
              }}
            />

            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: messageInput.trim() ? "#25D366" : "#E9EDEF",
                border: "none",
                cursor: messageInput.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                transition: "all 0.2s"
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}

      {/* 3️⃣ RIGHT PANEL - CHAT INFO */}
      {showChatInfo && selectedChat && (
        <div style={{
          width: "350px",
          background: "#fff",
          borderLeft: "1px solid #E9EDEF",
          overflowY: "auto"
        }}>
          <ChatInfoPanel
            chat={selectedChat}
            onClose={() => setShowChatInfo(false)}
            onLeaveCommunity={handleLeaveCommunity}
          />
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENTS ====================

function ChatListItem({ chat, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        display: "flex",
        gap: "12px",
        cursor: "pointer",
        background: isActive ? "#F0F2F5" : "#fff",
        borderBottom: "1px solid #F0F2F5",
        transition: "background 0.2s"
      }}
      onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "#F5F6F6")}
      onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "#fff")}
    >
      {/* Avatar */}
      <div style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "18px",
        flexShrink: 0
      }}>
        {chat.avatar}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px"
        }}>
          <h4 style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#111B21",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {chat.name}
          </h4>
          <span style={{
            fontSize: "12px",
            color: "#667781",
            flexShrink: 0,
            marginLeft: "8px"
          }}>
            {chat.timestamp}
          </span>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <p style={{
            fontSize: "14px",
            color: "#667781",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <div style={{
              minWidth: "20px",
              height: "20px",
              borderRadius: "10px",
              background: "#25D366",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 6px",
              marginLeft: "8px"
            }}>
              {chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  // Backend uses 'body' property for message text
  const messageText = message.body || message.content || message.text || "";
  
  return (
    <div style={{
      display: "flex",
      justifyContent: isOwn ? "flex-end" : "flex-start",
      marginBottom: "4px"
    }}>
      <div style={{
        maxWidth: "65%",
        background: isOwn ? "#D9FDD3" : "#fff",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
        position: "relative"
      }}>
        {!isOwn && (
          <div 
            onClick={() => message.sender_id && (window.location.href = `/profile/${message.sender_id}`)}
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: message.sender_name ? "#00796B" : "#667781",
              marginBottom: "4px",
              cursor: message.sender_id ? "pointer" : "default"
            }}
            onMouseEnter={(e) => message.sender_id && (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            title={message.sender_id ? "View profile" : ""}
          >
            {message.sender_name || message.sender_email || "Unknown"}
          </div>
        )}

        <p style={{
          fontSize: "14.2px",
          color: "#111B21",
          margin: 0,
          lineHeight: "1.4",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap"
        }}>
          {messageText}
        </p>

        <span style={{
          fontSize: "11px",
          color: "#667781",
          marginTop: "4px",
          display: "block",
          textAlign: "right"
        }}>
          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : "Now"}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#F8F9FA",
      borderBottom: "6px solid #25D366"
    }}>
      <div style={{
        width: "320px",
        textAlign: "center"
      }}>
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          opacity: 0.2
        }}>
          <MessageSquare size={50} color="#fff" />
        </div>

        <h2 style={{
          fontSize: "32px",
          fontWeight: "300",
          color: "#41525d",
          margin: "0 0 12px 0"
        }}>
          The Obsidian Circle
        </h2>

        <p style={{
          fontSize: "14px",
          color: "#667781",
          lineHeight: "1.6",
          margin: 0
        }}>
          Select a chat to start messaging with your community
        </p>
      </div>
    </div>
  );
}

function ChatInfoPanel({ chat, onClose, onLeaveCommunity }) {
  return (
    <div style={{ height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "24px 16px",
        background: "#F0F2F5",
        textAlign: "center",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            ...iconButtonStyle
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          margin: "0 auto 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "64px",
          fontWeight: "600"
        }}>
          {chat.avatar}
        </div>

        <h3 style={{
          fontSize: "21px",
          fontWeight: "500",
          color: "#111B21",
          margin: "0 0 4px 0"
        }}>
          {chat.name}
        </h3>

        <span style={{
          fontSize: "14px",
          color: "#667781"
        }}>
          Community • {chat.members.length} members
        </span>
      </div>

      {/* Info Sections */}
      <div style={{ padding: "20px 0" }}>
        <SectionHeader title="Description" />
        <div style={{ padding: "12px 24px", fontSize: "14px", color: "#111B21" }}>
          Welcome to {chat.name}. Connect and collaborate with your peers!
        </div>

        <SectionHeader title={`${chat.members.length} Members`} />
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {chat.members.map((member, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 24px",
                display: "flex",
                gap: "12px",
                alignItems: "center"
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#DFE5E7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "500",
                color: "#667781"
              }}>
                {member.name?.charAt(0) || "U"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", color: "#111B21" }}>
                  {member.name || "Unknown User"}
                </div>
                <div style={{ fontSize: "13px", color: "#667781" }}>
                  {member.role || "Member"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: "20px 24px" }}>
          <button 
            onClick={() => onLeaveCommunity(chat.id)}
            style={{
            width: "100%",
            padding: "12px",
            background: "#FEF1F1",
            color: "#D32F2F",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <LogOut size={16} />
            Leave Community
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{
      padding: "12px 24px",
      background: "#F0F2F5",
      fontSize: "14px",
      fontWeight: "500",
      color: "#667781"
    }}>
      {title}
    </div>
  );
}

// ==================== STYLES ====================

const iconButtonStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#54656F",
  padding: "8px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s"
};

const searchBarStyle = {
  display: "flex",
  alignItems: "center",
  background: "#fff",
  borderRadius: "8px",
  border: "1px solid #E9EDEF"
};

const searchInputStyle = {
  flex: 1,
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  fontSize: "14px",
  color: "#111B21",
  outline: "none"
};
