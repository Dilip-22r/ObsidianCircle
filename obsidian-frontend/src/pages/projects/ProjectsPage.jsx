import { useState, useEffect } from "react";
import { fetchApi } from "../../hooks/useFetch";
import useAuth from "../../hooks/useAuth";
import { Plus, Users, Github, TrendingUp, Award } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all"); // all, active, completed
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await fetchApi("/projects");
      setProjects(data.projects);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinProject(projectId) {
    try {
      await fetchApi(`/projects/${projectId}/join`, { method: "POST" });
      loadProjects();
    } catch (err) {
      alert(err.message || "Failed to join project");
    }
  }

  const filteredProjects = projects.filter(p => {
    if (filter === "mine") {
      return p.members.some(m => m.student_id === user?.id) || p.mentor_id === user?.id;
    }
    if (filter === "active") return !p.published;
    if (filter === "completed") return p.published;
    return true;
  });

  if (loading) return <div style={{ padding: 40, color: "#111827" }}>Loading projects...</div>;

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", background: "#F9FAFB" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "4px", color: "#111827" }}>
            Projects
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>
            {user?.role === "student" ? "Browse projects to build your portfolio" : "Manage and mentor student projects"}
          </p>
        </div>
        {(user?.role === "alumni" || user?.role === "admin") && (
          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["all", "mine", "active", "completed"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px",
              background: filter === f ? "#6366F1" : "#fff",
              color: filter === f ? "#fff" : "#374151",
              border: filter === f ? "none" : "1px solid #E5E7EB",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              textTransform: "capitalize"
            }}
          >
            {f === "mine" ? "My Projects" : f}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #E5E7EB"
        }}>
          <p style={{ fontSize: "16px", color: "#6B7280" }}>No projects found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              userRole={user?.role}
              userId={user?.id}
              onJoin={() => handleJoinProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && <CreateProjectModal onClose={() => { setShowCreateModal(false); loadProjects(); }} />}
    </div>
  );
}

function ProjectCard({ project, userRole, userId, onJoin }) {
  const isMember = project.members.some(m => m.student_id === userId);
  const memberCount = project.members.length;

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "4px" }}>
            {project.title}
          </h3>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.5" }}>
            {project.description}
          </p>
        </div>
        <div style={{
          background: project.published ? "#ECFDF5" : "#FEF3C7",
          color: project.published ? "#059669" : "#D97706",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          flexShrink: 0
        }}>
          {project.published ? "DONE" : "ACTIVE"}
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6B7280" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={14} />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <TrendingUp size={14} />
          {project.total_score} points
        </div>
      </div>



      {(userRole === "student" || isMember) && !project.published && (
        <button
          onClick={() => {
            if (userRole === "student" && !isMember) {
              onJoin();
            }
            if (project.repo_url) {
              window.open(project.repo_url, "_blank");
            } else {
              alert("No repository link provided for this project.");
            }
          }}
          style={{
            marginTop: "8px",
            padding: "10px 16px",
            background: isMember ? "#10B981" : "#6366F1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <Github size={18} />
          View Project
        </button>
      )}

      {project.published && (
        <div style={{
          marginTop: "8px",
          padding: "8px 12px",
          background: "#F0FDF4",
          color: "#16A34A",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "600",
          textAlign: "center"
        }}>
          Project Completed
        </div>
      )}
    </div>
  );
}

function CreateProjectModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repo_url: "",
    total_score: 100,
    is_team_based: true
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await fetchApi("/projects", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      alert("Project created successfully!");
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create project");
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
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="e.g., Smart Attendance System, E-commerce App"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Describe your project, the tech stack used, and what you aim to achieve..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          />
          <input
            type="url"
            placeholder="e.g., https://github.com/username/project-name (optional)"
            value={formData.repo_url}
            onChange={e => setFormData({ ...formData, repo_url: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Total Score (e.g., 100)"
            value={formData.total_score}
            onChange={e => setFormData({ ...formData, total_score: Number(e.target.value) })}
            min="0"
            required
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button type="submit" style={primaryButtonStyle}>Create Project</button>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #E5E7EB",
  fontSize: "14px",
  fontFamily: "inherit"
};

const primaryButtonStyle = {
  flex: 1,
  padding: "10px 20px",
  background: "#6366F1",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const secondaryButtonStyle = {
  flex: 1,
  padding: "10px 20px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #E5E7EB",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};
