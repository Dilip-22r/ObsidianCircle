import { useMemo, memo } from "react";
import { useCachedFetch } from "../../hooks/useCachedFetch";
import useAuth from "../../hooks/useAuth";
import { TrendingUp, Users, FolderOpen, Award, AlertCircle, CheckCircle } from "lucide-react";

function DashboardPage() {
  const { user } = useAuth();
  
  // Use cached fetch for better performance
  const { data: projectsData, loading: projectsLoading } = useCachedFetch("/projects", {}, 300000); // 5 minutes cache
  const { data: pendingData, loading: pendingLoading } = useCachedFetch("/admin/alumni-pending", {}, 60000); // 1 minute cache

  // Calculate stats using useMemo for better performance
  const stats = useMemo(() => {
    if (!projectsData?.projects || !user?.role) return null;
    
    if (user.role === "student") {
      const myProjects = projectsData.projects.filter(p =>
        p.members.some(m => m.student_id === user.id)
      );
      const totalScore = myProjects.reduce((acc, p) => {
        const member = p.members.find(m => m.student_id === user.id);
        return acc + (member?.contribution_score || 0);
      }, 0);
      const stars = myProjects.filter(p =>
        p.members.find(m => m.student_id === user.id)?.star_awarded
      ).length;
      
      return { projects: myProjects.length, score: totalScore, stars };
    } else if (user.role === "alumni") {
      const mentoredProjects = projectsData.projects.filter(p => p.mentor_id === user.id);
      const studentsHelped = new Set(
        mentoredProjects.flatMap(p => p.members.map(m => m.student_id))
      ).size;
      
      return { projects: mentoredProjects.length, students: studentsHelped };
    }
    
    return null;
  }, [projectsData?.projects, user?.role, user?.id]);

  const loading = projectsLoading || (user?.role === "admin" && pendingLoading);
  const projects = projectsData?.projects || [];
  const pendingAlumni = pendingData?.pending || [];

  if (loading) return <div style={{ padding: 40, color: "#111827" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", background: "#F9FAFB" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>
        Welcome, {user?.email?.split("@")[0] || "User"}
      </h1>
      <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "32px" }}>
        {user?.role === "student" && "Track your project contributions and growth"}
        {user?.role === "alumni" && "Manage your mentored projects and guide students"}
        {user?.role === "admin" && "Oversee platform operations and user management"}
      </p>

      {/* Stats Grid */}
      {user?.role === "student" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
          <StatCard icon={FolderOpen} label="Active Projects" value={stats.projects} color="#6366F1" />
          <StatCard icon={TrendingUp} label="Total Score" value={stats.score} color="#10B981" />
          <StatCard icon={Award} label="Stars Earned" value={stats.stars} color="#F59E0B" />
        </div>
      )}

      {user?.role === "alumni" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "32px" }}>
          <StatCard icon={FolderOpen} label="Projects Mentored" value={stats.projects} color="#6366F1" />
          <StatCard icon={Users} label="Students Helped" value={stats.students} color="#10B981" />
        </div>
      )}

      {user?.role === "admin" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "32px" }}>
          <StatCard icon={Users} label="Total Users" value={projects.length} color="#6366F1" />
          <StatCard icon={AlertCircle} label="Pending Alumni" value={pendingAlumni.length} color="#EF4444" />
        </div>
      )}

      {/* Recent Projects */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>
          {user?.role === "alumni" ? "Your Mentored Projects" : "Recent Projects"}
        </h2>
        {projects.length === 0 ? (
          <p style={{ color: "#6B7280" }}>No projects available yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {projects.slice(0, 5).map(project => (
              <div key={project.id} style={{
                padding: "16px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#111827", marginBottom: "4px" }}>{project.title}</div>
                  <div style={{ fontSize: "13px", color: "#6B7280" }}>{project.description}</div>
                </div>
                <div style={{
                  background: project.published ? "#ECFDF5" : "#FEF3C7",
                  color: project.published ? "#059669" : "#D97706",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {project.published ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {project.published ? "Completed" : "Active"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin-specific: Pending Alumni Approvals */}
      {user?.role === "admin" && pendingAlumni.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", marginTop: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>
            Pending Alumni Approvals
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pendingAlumni.map(alumni => (
              <div key={alumni.id} style={{
                padding: "12px",
                border: "1px solid #FEE2E2",
                borderRadius: "8px",
                background: "#FEF2F2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#111827" }}>{alumni.email}</div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>ID: {alumni.external_id}</div>
                </div>
                <button style={{
                  padding: "6px 12px",
                  background: "#6366F1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500"
                }}>
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DashboardPage);

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color
        }}>
          <Icon size={20} />
        </div>
        <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>{label}</div>
      </div>
      <div style={{ fontSize: "32px", fontWeight: "700", color: "#111827" }}>{value}</div>
    </div>
  );
}
