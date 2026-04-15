export default function MessageBubble({ message }) {
  const isReceived = message.sender === "received";
  const isSent = message.sender === "sent";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isSent ? "flex-end" : "flex-start",
        marginBottom: "16px",
        gap: "8px",
      }}
    >
      {/* Avatar for received messages */}
      {isReceived && message.senderName && (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: message.role === "Student" ? "#10b981" : "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "600",
            fontSize: "12px",
            flexShrink: 0,
          }}
        >
          {message.senderName.charAt(0)}
        </div>
      )}

      {/* Message Content */}
      <div style={{ maxWidth: "70%" }}>
        {/* Message Bubble */}
        <div
          style={{
            padding: "10px 14px",
            background: isSent ? "#6366f1" : "#fff",
            color: isSent ? "#fff" : "#1a1a1a",
            borderRadius: isSent ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            fontSize: "14px",
            lineHeight: "1.5",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {/* Render text with @mentions highlighted */}
          {message.text.split(/(@\w+)/).map((part, index) =>
            part.startsWith("@") ? (
              <span
                key={index}
                style={{
                  color: isSent ? "#bfdbfe" : "#3b82f6",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {part}
              </span>
            ) : (
              part
            )
          )}
        </div>

        {/* File Attachments */}
        {message.hasFiles && message.files && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {message.files.map((file, index) => (
              <div
                key={index}
                style={{
                  background: file.color,
                  padding: "16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
                <div style={{ color: "#fff", fontWeight: "600", fontSize: "13px", marginBottom: "4px" }}>
                  {file.name}
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>{file.size}</div>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and Status */}
        <div
          style={{
            fontSize: "11px",
            color: "#999",
            marginTop: "4px",
            textAlign: isSent ? "right" : "left",
          }}
        >
          {message.time}
          {message.delivered && isSent && (
            <span style={{ marginLeft: "6px", color: "#6366f1" }}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
