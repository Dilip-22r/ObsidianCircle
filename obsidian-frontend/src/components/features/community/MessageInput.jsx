import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile } from "lucide-react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && onSend) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  return (
    <div
      style={{
        padding: "16px 20px",
        borderTop: "1px solid #E5E7EB",
        background: "#fff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          background: "#F9FAFB",
          padding: "8px 12px",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
        }}
      >
        <button
          type="button"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "#9CA3AF",
          }}
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            resize: "none",
            maxHeight: "120px",
            padding: "8px 0",
            fontSize: "15px",
            outline: "none",
            color: "#111827",
          }}
        />

        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            background: text.trim() ? "#6366F1" : "transparent",
            color: text.trim() ? "#fff" : "#9CA3AF",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: text.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <Send size={18} />
        </button>
      </form>
      <div style={{ padding: "4px 8px", fontSize: "11px", color: "#9CA3AF", textAlign: "right" }}>
        Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
}
