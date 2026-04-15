import { useState, useEffect } from "react";
import { fetchApi } from "../../hooks/useFetch";
import useAuth from "../../hooks/useAuth";
import { Send, CheckCircle, XCircle, Ban, Clock } from "lucide-react";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    loadReferrals();
    loadProjects();
  }, []);

  async function loadReferrals() {
    try {
      // Note: Backend doesn't have a list endpoint, so we'd need to implement or use individual fetches
      // For now, we'll show placeholder until we can fetch
      setReferrals([]);
    } catch (err) {
      console.error("Failed to load referrals", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const data = await fetchApi("/projects");
      setProjects(data.projects);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  }

  async function handleAction(referralId, action) {
    try {
      await fetchApi(`/referrals/${referralId}/${action}`, { method: "POST" });
      alert(`Referral ${action}ed successfully!`);
      loadReferrals();
    } catch (err) {
      alert(err.message || `Failed to ${action} referral`);
    }
  }

  if (loading) return <div style={{ padding: 40, color: "#111827" }}>Loading referrals...</div>;

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", background: "#F9FAFB" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "4px", color: "#111827" }}>
            Referrals
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>
            {user?.role === "student" 
              ? "Request referrals from mentors for your completed projects"
              : "Manage incoming referral requests from students"}
          </p>
        </div>
        {user?.role === "student" && (
          <button
            onClick={() => setShowRequestModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#6366F1",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <Send size={18} />
            Request Referral
          </button>
        )}
      </div>

      {referrals.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #E5E7EB"
        }}>
          <Send size={48} color="#E5E7EB" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "16px", color: "#6B7280" }}>
            {user?.role === "student" 
              ? "No referral requests yet. Complete projects and request referrals from mentors."
              : "No incoming referral requests"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {referrals.map(referral => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              userRole={user?.role}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {showRequestModal && (
        <RequestReferralModal
          projects={projects}
          onClose={() => { setShowRequestModal(false); loadReferrals(); }}
        />
      )}
    </div>
  );
}

function ReferralCard({ referral, userRole, onAction }) {
  const statusConfig = {
    pending: { color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
    accepted: { color: "#10B981", bg: "#D1FAE5", icon: CheckCircle },
    ignored: { color: "#6B7280", bg: "#F3F4F6", icon: XCircle },
    blocked: { color: "#EF4444", bg: "#FEE2E2", icon: Ban }
  };

  const config = statusConfig[referral.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "4px" }}>
            Project: {referral.project_title}
          </h3>
          <p style={{ fontSize: "13px", color: "#6B7280" }}>
            {userRole === "student" ? `To: Mentor ID ${referral.mentor_id}` : `From: Student ID ${referral.student_id}`}
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: config.bg,
          color: config.color,
          padding: "6px 12px",
          borderRadius: "16px",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          <StatusIcon size={14} />
          {referral.status.toUpperCase()}
        </div>
      </div>

      {referral.notes && (
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px", fontStyle: "italic" }}>
          "{referral.notes}"
        </p>
      )}

      {userRole === "alumni" && referral.status === "pending" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button
            onClick={() => onAction(referral.id, "accept")}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: "#10B981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <CheckCircle size={16} />
            Accept
          </button>
          <button
            onClick={() => onAction(referral.id, "ignore")}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: "#6B7280",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <XCircle size={16} />
            Ignore
          </button>
          <button
            onClick={() => onAction(referral.id, "block")}
            style={{
              padding: "8px 16px",
              background: "#EF4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Ban size={16} />
            Block
          </button>
        </div>
      )}
    </div>
  );
}

function RequestReferralModal({ projects, onClose }) {
  const [formData, setFormData] = useState({
    project_id: "",
    mentor_id: "",
    notes: ""
  });

  const selectedProject = projects.find(p => p.id === Number(formData.project_id));

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await fetchApi("/referrals", {
        method: "POST",
        body: JSON.stringify({
          project_id: Number(formData.project_id),
          mentor_id: Number(formData.mentor_id),
          notes: formData.notes
        })
      });
      alert("Referral request sent successfully!");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to request referral");
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px",
        width: "500px",
        maxWidth: "90%"
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>Request Referral</h2>
        <form onSubmit={handleSubmit}>
          <select
            value={formData.project_id}
            onChange={e => setFormData({ ...formData, project_id: e.target.value, mentor_id: "" })}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #E5E7EB",
              fontSize: "14px",
              fontFamily: "inherit"
            }}
          >
            <option value="">Select a project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {selectedProject && (
            <input
              type="number"
              placeholder="Mentor ID"
              value={formData.mentor_id}
              onChange={e => setFormData({ ...formData, mentor_id: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "12px",
                borderRadius: "6px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                fontFamily: "inherit"
              }}
            />
          )}

          <textarea
            placeholder="Add a note (optional)"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #E5E7EB",
              fontSize: "14px",
              fontFamily: "inherit",
              minHeight: "80px",
              resize: "vertical"
            }}
          />

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px 20px",
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Send Request
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 20px",
                background: "#fff",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
