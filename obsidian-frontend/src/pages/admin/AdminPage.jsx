import { useState, useEffect } from "react";
import { fetchApi } from "../../hooks/useFetch";
import { UserCheck, Ban, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // pending, audits

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [pendingData, auditData] = await Promise.all([
        fetchApi("/admin/alumni-pending"),
        fetchApi("/admin/audits")
      ]);
      setPendingAlumni(pendingData.pending || []);
      setAudits(auditData.audits || []);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId) {
    try {
      await fetchApi(`/admin/approve/${userId}`, { method: "POST" });
      alert("Alumni approved successfully!");
      loadAdminData();
    } catch (err) {
      alert(err.message || "Failed to approve alumni");
    }
  }

  async function handleBan(userId) {
    if (!confirm("Are you sure you want to ban this user?")) return;
    try {
      await fetchApi(`/auth/ban/${userId}`, { method: "POST" });
      alert("User banned successfully!");
      loadAdminData();
    } catch (err) {
      alert(err.message || "Failed to ban user");
    }
  }

  async function handlePenalize(userId) {
    const reason = prompt("Enter reason for penalty:");
    if (!reason) return;
    try {
      await fetchApi(`/admin/penalize/${userId}`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      alert("Penalty recorded!");
      loadAdminData();
    } catch (err) {
      alert(err.message || "Failed to record penalty");
    }
  }

  if (loading) return <div style={{ padding: 40, color: "#111827" }}>Loading admin panel...</div>;

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", background: "#F9FAFB" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>
        Admin Control Panel
      </h1>
      <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
        Manage users, approve alumni, and monitor platform activity
      </p>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #E5E7EB"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F59E0B"
            }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>Pending Alumni</div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#111827" }}>{pendingAlumni.length}</div>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #E5E7EB"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6"
            }}>
              <FileText size={20} />
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>Total Audits</div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#111827" }}>{audits.length}</div>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #E5E7EB"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "#D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981"
            }}>
              <CheckCircle size={20} />
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>System Status</div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "#10B981" }}>Operational</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[
          { id: "pending", label: "Pending Alumni", icon: UserCheck },
          { id: "audits", label: "Audit Logs", icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: activeTab === tab.id ? "#6366F1" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#374151",
              border: activeTab === tab.id ? "none" : "1px solid #E5E7EB",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "pending" && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>
            Alumni Pending Approval
          </h2>
          {pendingAlumni.length === 0 ? (
            <p style={{ color: "#6B7280" }}>No pending alumni approvals.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingAlumni.map(alumni => (
                <div key={alumni.id} style={{
                  padding: "16px",
                  border: "1px solid #FEE2E2",
                  borderRadius: "8px",
                  background: "#FEF2F2",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#111827", marginBottom: "4px" }}>
                      {alumni.email}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>
                      ID: {alumni.external_id} • Registered: {new Date(alumni.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleApprove(alumni.id)}
                      style={{
                        padding: "8px 16px",
                        background: "#10B981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleBan(alumni.id)}
                      style={{
                        padding: "8px 16px",
                        background: "#EF4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Ban size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "audits" && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>
            Audit Logs
          </h2>
          {audits.length === 0 ? (
            <p style={{ color: "#6B7280" }}>No audit logs available.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                    <th style={tableHeaderStyle}>ID</th>
                    <th style={tableHeaderStyle}>Action</th>
                    <th style={tableHeaderStyle}>Actor</th>
                    <th style={tableHeaderStyle}>Target</th>
                    <th style={tableHeaderStyle}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.slice().reverse().slice(0, 50).map(audit => (
                    <tr key={audit.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={tableCellStyle}>{audit.id}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          background: getActionColor(audit.action).bg,
                          color: getActionColor(audit.action).text,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {audit.action}
                        </span>
                      </td>
                      <td style={tableCellStyle}>User {audit.actor_id}</td>
                      <td style={tableCellStyle}>#{audit.target_id}</td>
                      <td style={tableCellStyle}>{new Date(audit.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const tableCellStyle = {
  padding: "12px 16px",
  fontSize: "14px",
  color: "#374151"
};

function getActionColor(action) {
  const colors = {
    register: { bg: "#DBEAFE", text: "#1E40AF" },
    approve_alumni: { bg: "#D1FAE5", text: "#065F46" },
    ban_user: { bg: "#FEE2E2", text: "#991B1B" },
    create_project: { bg: "#E0E7FF", text: "#3730A3" },
    penalize: { bg: "#FEE2E2", text: "#991B1B" }
  };
  return colors[action] || { bg: "#F3F4F6", text: "#374151" };
}
