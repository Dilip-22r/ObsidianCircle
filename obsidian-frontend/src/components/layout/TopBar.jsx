import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Search, Bell, User, LogOut, Sun, Moon } from "lucide-react";

export default function TopBar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get current page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('projects')) return 'Projects';
    if (path.includes('communities')) return 'Communities';
    if (path.includes('search')) return 'Search';
    if (path.includes('referrals')) return 'Referrals';
    if (path.includes('profile')) return 'Profile';
    if (path.includes('admin')) return 'Admin';
    return 'Dashboard';
  };

  // Get user's first name from email or profile
  const getUserName = () => {
    if (user?.profile?.name) {
      return user.profile.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <div
      style={{
        height: "56px",
        background: "#1F2937",
        borderBottom: "1px solid #374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      {/* Left Side - Logo + User Name & Role */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: "250px" }}>
        {/* Logo/Icon */}
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "700",
          color: "#fff"
        }}>
          OC
        </div>

        {/* User Name & Role */}
        <div>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: "600", 
            color: "#F9FAFB",
            lineHeight: "1.2"
          }}>
            {getUserName()}
          </div>
          <div style={{ 
            fontSize: "11px", 
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: "1.2"
          }}>
            {user?.role || 'Student'}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "1px",
          height: "32px",
          background: "#374151"
        }} />

        {/* Page Title */}
        <div style={{
          fontSize: "14px",
          fontWeight: "500",
          color: "#D1D5DB"
        }}>
          {getPageTitle()}
        </div>
      </div>

      {/* Center - Search Bar */}
      <div
        style={{
          flex: 1,
          maxWidth: "500px",
          margin: "0 24px",
          position: "relative",
        }}
      >
        <Search
          size={16}
          color="#9CA3AF"
          style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)" 
          }}
        />
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: "100%",
            padding: "8px 12px 8px 36px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#111827",
            fontSize: "13px",
            color: "#F9FAFB",
            outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = "#6366F1"}
          onBlur={(e) => e.target.style.borderColor = "#374151"}
        />
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "11px",
            color: "#6B7280",
            border: "1px solid #374151",
            borderRadius: "3px",
            padding: "2px 6px",
            background: "#1F2937",
            fontFamily: "monospace"
          }}
        >
          ⌘K
        </div>
      </div>

      {/* Right Side - Role Badge + Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Role Badge */}
        <div style={{
          padding: "4px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          background: user?.role === "student" ? "#1E3A8A" : user?.role === "alumni" ? "#5B21B6" : "#991B1B",
          color: "#fff"
        }}>
          {user?.role || 'Student'}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "6px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9CA3AF",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#374151";
            e.currentTarget.style.color = "#F9FAFB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9CA3AF";
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9CA3AF",
              transition: "all 0.2s",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#374151";
              e.currentTarget.style.color = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <Bell size={18} />
            {/* Notification Badge */}
            <div
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#EF4444",
                border: "2px solid #1F2937",
              }}
            />
          </button>
        </div>

        {/* Profile Avatar with Dropdown */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              border: showDropdown ? "2px solid #6366F1" : "2px solid transparent",
              transition: "all 0.2s"
            }}
            title="Profile Menu"
          >
            {user?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#1F2937",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                border: "1px solid #374151",
                minWidth: "200px",
                zIndex: 1000
              }}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* User Info Header */}
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #374151"
              }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#F9FAFB" }}>
                  {getUserName()}
                </div>
                <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                  {user?.email}
                </div>
              </div>

              {/* Menu Items */}
              <div
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#D1D5DB",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#374151";
                  e.currentTarget.style.color = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#D1D5DB";
                }}
              >
                <User size={16} />
                View Profile
              </div>
              
              <div style={{ height: "1px", background: "#374151", margin: "4px 0" }} />
              
              <div
                onClick={async () => {
                  await logout();
                  setShowDropdown(false);
                  navigate("/auth");
                }}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#EF4444",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#7F1D1D";
                  e.currentTarget.style.color = "#FEE2E2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#EF4444";
                }}
              >
                <LogOut size={16} />
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
