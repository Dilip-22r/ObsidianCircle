import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderOpen, 
  MessageSquare, 
  Compass, 
  User, 
  Settings, 
  HelpCircle, 
  Share2,
  MessageCircle
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FolderOpen, label: "Projects", path: "/projects" },
    { icon: MessageSquare, label: "Communities", path: "/communities" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Compass, label: "Search", path: "/search" },
    { icon: Share2, label: "Referrals", path: "/referrals" },
  ];

  return (
    <div
      style={{
        width: "260px",
        height: "100vh",
        background: "#1E1F25", // Modern dark charcoal
        color: "#9CA3AF", // Muted gray text
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Branding */}
      <div style={{ padding: "24px", color: "#fff", borderBottom: "1px solid #2B2D31" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.025em", margin: 0 }}>
          The Obsidian Circle
        </h1>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                color: active ? "#FFFFFF" : "inherit",
                background: active ? "#6366F1" : "transparent", // Indigo accent
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#E5E7EB";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #2B2D31" }}>
        <Link
          to="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            marginBottom: "4px",
            textDecoration: "none",
            fontSize: "14px",
            color: "inherit",
          }}
        >
          <Settings size={18} />
          Settings
        </Link>
        <Link
          to="/help"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
            color: "inherit",
          }}
        >
          <HelpCircle size={18} />
          Help & Support
        </Link>
      </div>
    </div>
  );
}
