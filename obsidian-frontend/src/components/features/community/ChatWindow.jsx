import { useState, useEffect, memo } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConversationHeader from "./ConversationHeader";
import { fetchApi } from "../../../hooks/useFetch";
import useAuth from "../../../hooks/useAuth";

function ChatWindow({ thread }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!thread) return;

    async function loadMessages() {
      try {
        // Only fetching community messages for now
        const data = await fetchApi(`/communities/${thread.id}/messages`);
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          text: msg.body,
          sender: msg.sender_id === user?.id ? "sent" : "received",
          senderName: msg.sender_id === user?.id ? "You" : "User " + msg.sender_id, // Minimal mapping
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: "Student", // Placeholder
          hasFiles: !!msg.file_url,
          files: msg.file_url ? [{ name: "Attachment", size: "Unknown", color: "#a78bfa" }] : []
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }
    loadMessages();
  }, [thread, user]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    try {
      const data = await fetchApi(`/communities/${thread.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text })
      });
      // Optimistically add or re-fetch
      const newMsg = {
        id: data.message.id,
        text: data.message.body,
        sender: "sent",
        senderName: "You",
        time: "Just now",
        role: user?.role,
        hasFiles: false
      };
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ConversationHeader thread={thread} />
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}

export default memo(ChatWindow);
