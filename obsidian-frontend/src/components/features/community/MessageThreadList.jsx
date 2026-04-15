export default function MessageThreadList({ threads = [], onSelectThread, selectedThread }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onSelectThread(thread)}
          style={{
            padding: "16px",
            marginBottom: "4px",
            borderRadius: "12px",
            cursor: "pointer",
            background: selectedThread?.id === thread.id ? "#FFFFFF" : "transparent",
            boxShadow: selectedThread?.id === thread.id ? "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" : "none",
            border: selectedThread?.id === thread.id ? "1px solid #E5E7EB" : "1px solid transparent",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (selectedThread?.id !== thread.id) {
              e.currentTarget.style.background = "rgba(255,255,255,0.6)";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedThread?.id !== thread.id) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            {/* Avatar */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: thread.role === "Student" ? "#E0F2FE" : "#F5F3FF", // Light blue/purple bg
                color: thread.role === "Student" ? "#0284C7" : "#7C3AED", // Text color
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "16px",
                flexShrink: 0,
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.05)",
              }}
            >
              {(thread.name || thread.sender || "?").charAt(0)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                <span style={{ 
                  fontWeight: thread.unread ? "700" : "600", 
                  fontSize: "15px", 
                  color: "#111827",
                  letterSpacing: "-0.01em"
                }}>
                  {thread.name || thread.sender}
                </span>
                <span style={{ 
                  fontSize: "12px", 
                  color: thread.unread ? "#6366F1" : "#9CA3AF",
                  fontWeight: thread.unread ? "600" : "400",
                  flexShrink: 0 
                }}>
                  {thread.timestamp}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: thread.role === "Student" ? "#059669" : "#4F46E5",
                  }}
                >
                  {thread.role}
                </span>
                {thread.unread && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366F1" }} />
                )}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: thread.unread ? "#374151" : "#6B7280",
                  fontWeight: thread.unread ? "500" : "400",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: "8px",
                }}
              >
                {thread.preview}
              </p>

              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "#F3F4F6",
                    color: "#4B5563",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {thread.context}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
