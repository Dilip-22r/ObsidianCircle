export default function ConversationHeader({ thread }) {
  if (!thread) return null;

  const displayName = thread.name || thread.sender || "Conversation";
  const displayRole = thread.type === "channel" ? "Community" : thread.role || "User";

  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #ddd",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Participant Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: displayRole === "Student" ? "#10b981" : displayRole === "Community" ? "#8B5CF6" : "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {displayName.charAt(0)}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "600", fontSize: "15px" }}>{displayName}</span>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: displayRole === "Student" ? "#d1fae5" : displayRole === "Community" ? "#EDE9FE" : "#dbeafe",
                color: displayRole === "Student" ? "#065f46" : displayRole === "Community" ? "#6B21A8" : "#1e40af",
              }}
            >
              {displayRole}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#10b981", marginTop: "2px" }}>
            ● Online
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#666",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Video call (coming soon)"
        >
          📹
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#666",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="More options"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}
