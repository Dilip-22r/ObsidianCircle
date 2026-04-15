import MessageBubble from "./MessageBubble";
import { useEffect, useRef } from "react";

export default function MessageList({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f9fafb" }}>
      {messages.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>
          No messages here yet. Say hello!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
