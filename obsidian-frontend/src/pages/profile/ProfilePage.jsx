import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import { fetchApi } from "../../hooks/useFetch";
import useAuth from "../../hooks/useAuth";
import ResumeUploader from "../../components/shared/ResumeUploader";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { 
  User, Briefcase, Github, FileText, Edit2, Mail, MapPin, 
  Award, TrendingUp, Users, CheckCircle, XCircle, Ban,
  Calendar, ExternalLink, Upload, Eye, Globe, Lock, X, Plus,
  Save, Trash2
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { uid } = useParams(); // Get UID from URL if viewing another user's profile
  const isOwnProfile = !uid || uid === user?.id;
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  async function loadProfileData() {
    try {
      const profileData = await fetchApi("/profiles/me");
      
      // Check if profile data exists
      if (!profileData || !profileData.profile) {
        console.error("Profile data is missing or malformed:", profileData);
        setLoading(false);
        return;
      }
      
      // Initialize developmentProfile and dsaProfile if not present
      if (!profileData.profile.developmentProfile) {
        profileData.profile.developmentProfile = {
          github: "",
          portfolio: ""
        };
      }
      if (!profileData.profile.dsaProfile) {
        profileData.profile.dsaProfile = {
          leetcode: "",
          codeforces: "",
          codechef: "",
          hackerrank: "",
          spoj: ""
        };
      }
      setProfile(profileData.profile);
      setEditForm(profileData.profile);

      const projectsData = await fetchApi("/projects");
      
      // Role-based project filtering
      if (user?.role === "student") {
        const myProjects = projectsData.projects.filter(p => 
          p.members.some(m => m.student_id === user?.id)
        );
        setProjects(myProjects);
      } else if (user?.role === "alumni") {
        const mentoredProjects = projectsData.projects.filter(p => p.mentor_id === user?.id);
        setProjects(mentoredProjects);
        
        // Fetch referrals for alumni (mock for now, needs backend endpoint)
        try {
          // This endpoint doesn't exist yet, so we'll handle gracefully
          const referralsData = await fetchApi("/referrals").catch(() => ({ referrals: [] }));
          setReferrals(referralsData.referrals || []);
        } catch {
          setReferrals([]);
        }
      } else {
        setProjects(projectsData.projects);
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
      console.error("Error details:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    // Validate Development Profile - GitHub is required for students
    if (user?.role === "student") {
      if (!editForm.developmentProfile?.github || editForm.developmentProfile.github.trim() === "") {
        setValidationError("GitHub profile is required in Development Profile");
        return;
      }
      
      // Validate DSA Profile - ALL fields are required for students
      const dsaFields = ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'spoj'];
      const missingFields = [];
      
      for (const field of dsaFields) {
        if (!editForm.dsaProfile?.[field] || editForm.dsaProfile[field].trim() === "") {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        setValidationError(`DSA profile incomplete. Missing: ${missingFields.join(', ')}`);
        return;
      }
    }
    
    setValidationError("");
    
    try {
      const response = await fetch("http://localhost:3001/profiles/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("session_token")}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
        setValidationError("");
      } else {
        const errorData = await response.json();
        setValidationError(errorData.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      setValidationError("Failed to save profile. Please try again.");
    }
  }

  function handleCancelEdit() {
    setEditForm(profile);
    setIsEditing(false);
    setValidationError("");
  }

  function handleAddSkill(skill) {
    if (skill && !editForm.skills?.includes(skill)) {
      setEditForm({
        ...editForm,
        skills: [...(editForm.skills || []), skill]
      });
    }
  }

  function handleRemoveSkill(skillToRemove) {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skillToRemove)
    });
  }

  if (loading) return <LoadingState />;
  if (!profile) return <ErrorState />;

  // Calculate stats based on role
  const stats = calculateStats(user, projects, profile);

  return (
    <div style={{ 
      padding: "32px", 
      maxWidth: "1400px", 
      margin: "0 auto", 
      height: "100%", 
      overflowY: "auto",
      background: "#F9FAFB"
    }}>
      {/* Validation Error */}
      {validationError && (
        <div style={{
          background: "#FEE2E2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "#991B1B",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <XCircle size={16} />
          {validationError}
        </div>
      )}

      {/* Profile Header */}
      <ProfileHeader 
        profile={isEditing ? editForm : profile} 
        user={user} 
        isEditing={isEditing}
        onToggleEdit={() => {
          if (isEditing) {
            handleSaveProfile();
          } else {
            setIsEditing(true);
          }
        }}
        onCancel={handleCancelEdit}
        onChange={(field, value) => setEditForm({...editForm, [field]: value})}
      />

      {/* Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "70% 30%", gap: "24px", marginTop: "32px" }}>
        {/* Left Column - Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {user?.role === "student" && (
            <>
              <AboutSection 
                profile={isEditing ? editForm : profile} 
                isEditing={isEditing}
                onChange={(field, value) => setEditForm({...editForm, [field]: value})}
              />
              <SkillsSection 
                profile={isEditing ? editForm : profile} 
                isEditing={isEditing}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
              />
              <DevelopmentProfileSection
                profile={isEditing ? editForm : profile}
                isEditing={isEditing}
                onChange={(field, value) => {
                  setEditForm({
                    ...editForm,
                    developmentProfile: {
                      ...editForm.developmentProfile,
                      [field]: value
                    }
                  });
                }}
              />
              <DSAProfileSection
                profile={isEditing ? editForm : profile}
                isEditing={isEditing}
                onChange={(field, value) => {
                  setEditForm({
                    ...editForm,
                    dsaProfile: {
                      ...editForm.dsaProfile,
                      [field]: value
                    }
                  });
                }}
              />
              <ProjectsSection projects={projects} userRole="student" userId={user?.id} />
            </>
          )}

          {user?.role === "alumni" && (
            <>
              <AlumniAboutSection 
                profile={isEditing ? editForm : profile}
                user={user}
                isEditing={isEditing}
                onChange={(field, value) => setEditForm({...editForm, [field]: value})}
              />
              <MentoredProjectsSection 
                projects={projects} 
                onSelectProject={setSelectedProject}
              />
              {referrals.length > 0 && (
                <ReferralRequestsSection 
                  referrals={referrals}
                  onRefresh={loadProfileData}
                />
              )}
            </>
          )}

          {user?.role === "admin" && (
            <>
              <AdminControlsSection />
              <PlatformStatsSection projects={projects} />
            </>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {user?.role === "student" && (
            <>
              <StatsCard stats={stats} />
              <ContributionChart projects={projects} userId={user?.id} />
              <QuickLinksCard 
                profile={isEditing ? editForm : profile}
                isEditing={isEditing}
                onChange={(field, value) => setEditForm({...editForm, [field]: value})}
              />
            </>
          )}

          {user?.role === "alumni" && (
            <>
              <MentorStatsCard stats={stats} />
              <QuickLinksCard 
                profile={isEditing ? editForm : profile}
                isEditing={isEditing}
                onChange={(field, value) => setEditForm({...editForm, [field]: value})}
              />
            </>
          )}

          {user?.role === "admin" && (
            <AdminQuickActionsCard />
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

// ==================== STUDENT COMPONENTS ====================

function AboutSection({ profile, isEditing, onChange }) {
  return (
    <Card title="About">
      {isEditing ? (
        <textarea
          value={profile.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px",
            border: "1px solid #D1D5DB",
            borderRadius: "6px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "vertical"
          }}
        />
      ) : (
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6" }}>
          {profile.bio || "No bio added yet. Click Edit Profile to add your bio."}
        </p>
      )}
      
      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {isEditing ? (
          <>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Education</label>
              <input
                type="text"
                value={profile.education || ""}
                onChange={(e) => onChange("education", e.target.value)}
                placeholder="VNR VJIET"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Company (Optional)</label>
              <input
                type="text"
                value={profile.company || ""}
                onChange={(e) => onChange("company", e.target.value)}
                placeholder="Company name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>
          </>
        ) : (
          <>
            {profile.education && (
              <InfoItem icon={MapPin} label="Education" value={profile.education} />
            )}
            {profile.company && (
              <InfoItem icon={Briefcase} label="Company" value={profile.company} />
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function SkillsSection({ profile, isEditing, onAddSkill, onRemoveSkill }) {
  const [newSkill, setNewSkill] = useState("");

  function handleAddClick() {
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill("");
    }
  }

  return (
    <Card title="Skills & Expertise">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {profile.skills && profile.skills.length > 0 ? (
          profile.skills.map((skill, idx) => (
            <span key={idx} style={{
              background: "#EEF2FF",
              color: "#4F46E5",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              border: "1px solid #C7D2FE",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              {skill}
              {isEditing && (
                <X 
                  size={14} 
                  style={{ cursor: "pointer" }} 
                  onClick={() => onRemoveSkill(skill)}
                />
              )}
            </span>
          ))
        ) : (
          !isEditing && <EmptyState message="No skills added" />
        )}
        
        {isEditing && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", width: "100%" }}>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddClick()}
              placeholder="Add a skill..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "13px"
              }}
            />
            <button
              onClick={handleAddClick}
              style={{
                padding: "8px 16px",
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function DevelopmentProfileSection({ profile, isEditing, onChange }) {
  function getProfileUrl(value) {
    if (!value) return null;
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `https://github.com/${value}`;
  }

  const githubUrl = getProfileUrl(profile.developmentProfile?.github);
  const hasGithub = !!profile.developmentProfile?.github;
  const hasPortfolio = !!profile.developmentProfile?.portfolio;

  return (
    <Card title="Development Profile">
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* GitHub - Required */}
          <div>
            <label style={{ 
              fontSize: "12px", 
              fontWeight: "600",
              color: "#374151", 
              marginBottom: "6px", 
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Github size={14} />
              <span>GitHub</span>
              <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={profile.developmentProfile?.github || ""}
              onChange={(e) => onChange("github", e.target.value)}
              placeholder="GitHub username or URL (required)"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${!profile.developmentProfile?.github ? "#FCA5A5" : "#D1D5DB"}`,
                borderRadius: "6px",
                fontSize: "13px",
                background: !profile.developmentProfile?.github ? "#FEF2F2" : "#fff"
              }}
            />
            {!profile.developmentProfile?.github && (
              <p style={{ fontSize: "11px", color: "#EF4444", margin: "4px 0 0 0" }}>
                GitHub profile is required
              </p>
            )}
          </div>

          {/* Portfolio - Optional */}
          <div>
            <label style={{ 
              fontSize: "12px", 
              fontWeight: "600",
              color: "#374151", 
              marginBottom: "6px", 
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Globe size={14} />
              <span>Portfolio Website</span>
              <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: "400" }}>(optional)</span>
            </label>
            <input
              type="url"
              value={profile.developmentProfile?.portfolio || ""}
              onChange={(e) => onChange("portfolio", e.target.value)}
              placeholder="https://yourportfolio.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "13px"
              }}
            />
          </div>

          <div style={{ 
            fontSize: "11px", 
            color: "#6B7280", 
            padding: "8px 12px",
            background: "#F9FAFB",
            borderRadius: "6px",
            border: "1px solid #E5E7EB"
          }}>
            💡 Enter your GitHub username or full profile URL
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {!hasGithub && (
            <div style={{
              padding: "12px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <XCircle size={16} />
              GitHub profile required - Click Edit Profile to add
            </div>
          )}

          {hasGithub && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "#fff",
                border: "2px solid #17151520",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#374151",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#171515";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(23,21,21,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#17151520";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                background: "#17151510"
              }}>
                <Github size={22} color="#171515" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#111827", fontSize: "14px", fontWeight: "600" }}>GitHub</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  {profile.developmentProfile.github}
                </div>
              </div>
              <ExternalLink size={16} color="#171515" />
            </a>
          )}

          {hasPortfolio && (
            <a
              href={profile.developmentProfile.portfolio}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "#fff",
                border: "2px solid #6366F120",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#374151",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366F1";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#6366F120";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                background: "#6366F110"
              }}>
                <Globe size={22} color="#6366F1" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#111827", fontSize: "14px", fontWeight: "600" }}>Portfolio</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>View website</div>
              </div>
              <ExternalLink size={16} color="#6366F1" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

function DSAProfileSection({ profile, isEditing, onChange }) {
  const platforms = [
    {
      name: "LeetCode",
      key: "leetcode",
      color: "#FFA116",
      baseUrl: "https://leetcode.com/u/",
      placeholder: "LeetCode username"
    },
    {
      name: "Codeforces",
      key: "codeforces",
      color: "#1F8ACB",
      baseUrl: "https://codeforces.com/profile/",
      placeholder: "Codeforces handle"
    },
    {
      name: "CodeChef",
      key: "codechef",
      color: "#5B4638",
      baseUrl: "https://www.codechef.com/users/",
      placeholder: "CodeChef username"
    },
    {
      name: "HackerRank",
      key: "hackerrank",
      color: "#00EA64",
      baseUrl: "https://www.hackerrank.com/profile/",
      placeholder: "HackerRank username"
    },
    {
      name: "SPOJ",
      key: "spoj",
      color: "#1E7FCB",
      baseUrl: "https://www.spoj.com/users/",
      placeholder: "SPOJ username"
    }
  ];

  function getProfileUrl(platform, value) {
    if (!value) return null;
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return platform.baseUrl + value;
  }

  const missingPlatforms = platforms.filter(p => !profile.dsaProfile?.[p.key]);
  const isIncomplete = missingPlatforms.length > 0;

  return (
    <Card title="DSA Profile">
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            padding: "10px 12px",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#1E40AF",
            fontWeight: "500"
          }}>
            ⚠️ All DSA platforms are mandatory
          </div>

          {platforms.map((platform) => (
            <div key={platform.key}>
              <label style={{ 
                fontSize: "12px", 
                fontWeight: "600",
                color: platform.color, 
                marginBottom: "6px", 
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>{platform.name}</span>
                <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={profile.dsaProfile?.[platform.key] || ""}
                onChange={(e) => onChange(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${!profile.dsaProfile?.[platform.key] ? "#FCA5A5" : "#D1D5DB"}`,
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: !profile.dsaProfile?.[platform.key] ? "#FEF2F2" : "#fff"
                }}
              />
              {!profile.dsaProfile?.[platform.key] && (
                <p style={{ fontSize: "11px", color: "#EF4444", margin: "4px 0 0 0" }}>
                  This field is required
                </p>
              )}
            </div>
          ))}

          <div style={{ 
            fontSize: "11px", 
            color: "#6B7280", 
            padding: "8px 12px",
            background: "#F9FAFB",
            borderRadius: "6px",
            border: "1px solid #E5E7EB"
          }}>
            💡 You can enter your username or full profile URL
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {isIncomplete && (
            <div style={{
              padding: "12px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <XCircle size={16} />
              Incomplete DSA Profile - Missing: {missingPlatforms.map(p => p.name).join(", ")}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {platforms.map((platform) => {
              const profileValue = profile.dsaProfile?.[platform.key];
              const profileUrl = getProfileUrl(platform, profileValue);
              const isAvailable = !!profileValue;

              return (
                <div key={platform.key}>
                  {isAvailable ? (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        background: "#fff",
                        border: `2px solid ${platform.color}20`,
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = platform.color;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${platform.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${platform.color}20`;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        background: `${platform.color}15`,
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: platform.color
                      }}>
                        {platform.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#111827", fontSize: "13px" }}>{platform.name}</div>
                        <div style={{ fontSize: "10px", color: "#9CA3AF" }}>View Profile</div>
                      </div>
                      <ExternalLink size={12} color={platform.color} />
                    </a>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        background: "#F9FAFB",
                        border: "1px dashed #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#9CA3AF",
                        cursor: "not-allowed"
                      }}
                      title="Required - Add in edit mode"
                    >
                      <div style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        background: "#E5E7EB",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#9CA3AF"
                      }}>
                        {platform.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px" }}>{platform.name}</div>
                        <div style={{ fontSize: "10px", color: "#EF4444" }}>Required ⚠️</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function ProjectsSection({ projects, userRole, userId }) {
  return (
    <Card title={`My Projects (${projects.length})`}>
      {projects.length === 0 ? (
        <EmptyState message="You haven't joined any projects yet" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {projects.map(project => {
            const member = project.members.find(m => m.student_id === userId);
            return (
              <div key={project.id} style={{
                padding: "16px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "600", margin: 0, color: "#111827" }}>
                      {project.title}
                    </h4>
                    {member?.star_awarded && (
                      <Award size={16} color="#F59E0B" fill="#F59E0B" />
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0" }}>
                    {project.description}
                  </p>
                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#9CA3AF" }}>
                    <span>Score: <strong style={{ color: "#10B981" }}>{member?.contribution_score || 0}</strong></span>
                    <span>Status: <strong>{project.published ? "Completed" : "Active"}</strong></span>
                  </div>
                </div>
                {project.repo_url && (
                  <a href={project.repo_url} target="_blank" rel="noreferrer" style={{
                    padding: "6px 12px",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    fontSize: "12px",
                    color: "#374151",
                    fontWeight: "500"
                  }}>
                    <Github size={14} />
                    Repo
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function StatsCard({ stats }) {
  return (
    <Card title="Profile Stats">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <StatItem icon={Award} label="Total Stars" value={stats.stars} color="#F59E0B" />
        <StatItem icon={TrendingUp} label="Total Score" value={stats.score} color="#10B981" />
        <StatItem icon={CheckCircle} label="Completed Projects" value={stats.completed} color="#6366F1" />
        <StatItem icon={Users} label="Active Projects" value={stats.active} color="#8B5CF6" />
      </div>
    </Card>
  );
}

function ContributionChart({ projects, userId }) {
  const chartData = projects.map(p => {
    const member = p.members.find(m => m.student_id === userId);
    return {
      name: p.title.substring(0, 15) + (p.title.length > 15 ? "..." : ""),
      value: member?.contribution_score || 5,
      fill: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
  });

  const fallbackData = [{ name: "No Data", value: 100, fill: "#E5E7EB" }];
  const data = chartData.length > 0 ? chartData : fallbackData;

  return (
    <Card title="Contribution Breakdown">
      <div style={{ height: "200px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: "#1F2937", 
                color: "#fff", 
                border: "none", 
                borderRadius: "8px",
                fontSize: "12px"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p style={{ textAlign: "center", fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
        Visual breakdown of project contributions
      </p>
    </Card>
  );
}

function QuickLinksCard({ profile, isEditing, onChange }) {
  return (
    <Card title="Quick Links & Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isEditing ? (
          <div>
            <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>GitHub URL</label>
            <input
              type="url"
              value={profile.github_url || ""}
              onChange={(e) => onChange("github_url", e.target.value)}
              placeholder="https://github.com/username"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "13px"
              }}
            />
          </div>
        ) : (
          profile.github_url && (
            <QuickLink icon={Github} label="GitHub Profile" href={profile.github_url} />
          )
        )}

        {profile.resume_url ? (
          <QuickLink icon={FileText} label="View Resume" href={profile.resume_url} />
        ) : (
          !isEditing && (
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              background: "#F9FAFB",
              border: "1px dashed #D1D5DB",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#6B7280",
              width: "100%"
            }}>
              <Upload size={16} />
              Upload Resume
            </button>
          )
        )}

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "#F9FAFB",
          borderRadius: "6px",
          fontSize: "13px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {profile.visibility === "public" ? <Globe size={16} color="#10B981" /> : <Lock size={16} color="#F59E0B" />}
            <span style={{ color: "#6B7280" }}>
              Visibility: <strong>{profile.visibility === "public" ? "Public" : "Alumni Only"}</strong>
            </span>
          </div>
          {isEditing && (
            <button
              onClick={() => onChange("visibility", profile.visibility === "public" ? "alumni_only" : "public")}
              style={{
                padding: "4px 12px",
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "600"
              }}
            >
              Toggle
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ==================== ALUMNI COMPONENTS ====================

function AlumniAboutSection({ profile, user, isEditing, onChange }) {
  return (
    <Card title="Professional Info">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
        {isEditing ? (
          <>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Company</label>
              <input
                type="text"
                value={profile.company || ""}
                onChange={(e) => onChange("company", e.target.value)}
                placeholder="Company name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Job Role</label>
              <input
                type="text"
                value={profile.job_role || ""}
                onChange={(e) => onChange("job_role", e.target.value)}
                placeholder="Your designation"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Education</label>
              <input
                type="text"
                value={profile.education || ""}
                onChange={(e) => onChange("education", e.target.value)}
                placeholder="VNR VJIET"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: "#F9FAFB",
                  color: "#9CA3AF"
                }}
              />
            </div>
          </>
        ) : (
          <>
            <InfoItem icon={Briefcase} label="Company" value={profile.company || "Not specified"} />
            <InfoItem icon={User} label="Role" value={profile.job_role || "Not specified"} />
            <InfoItem icon={MapPin} label="Education" value={profile.education || "VNR VJIET"} />
            <InfoItem icon={Mail} label="Email" value={user?.email || ""} />
          </>
        )}
      </div>
      <div>
        {isEditing ? (
          <div>
            <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block" }}>Professional Bio</label>
            <textarea
              value={profile.bio || ""}
              onChange={(e) => onChange("bio", e.target.value)}
              placeholder="Share your professional experience and mentorship approach..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6" }}>
            {profile.bio || "No description added"}
          </p>
        )}
      </div>
    </Card>
  );
}

function MentoredProjectsSection({ projects, onSelectProject }) {
  return (
    <Card title={`Mentored Projects (${projects.length})`}>
      {projects.length === 0 ? (
        <EmptyState message="No projects mentored yet" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => onSelectProject(project)}
              style={{
                padding: "16px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366F1"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{project.title}</h4>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: project.published ? "#D1FAE5" : "#FEF3C7",
                  color: project.published ? "#065F46" : "#92400E"
                }}>
                  {project.published ? "Completed" : "Active"}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "10px" }}>
                {project.description}
              </p>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#9CA3AF" }}>
                <span><Users size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {project.members.length} members
                </span>
                <span><TrendingUp size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {project.total_score} total score
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ReferralRequestsSection({ referrals, onRefresh }) {
  async function handleReferralAction(referralId, action) {
    try {
      const response = await fetch(`http://localhost:3001/referrals/${referralId}/${action}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("session_token")}`
        }
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(`Failed to ${action} referral`, err);
    }
  }

  const pendingReferrals = referrals.filter(r => r.status === "pending");

  return (
    <Card title={`Referral Requests (${pendingReferrals.length})`}>
      {pendingReferrals.length === 0 ? (
        <EmptyState message="No pending referral requests" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pendingReferrals.map(referral => (
            <div key={referral.id} style={{
              padding: "16px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              background: "#FFF"
            }}>
              <div style={{ marginBottom: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
                  Student ID: {referral.student_id}
                </h4>
                <p style={{ fontSize: "12px", color: "#6B7280" }}>
                  {referral.notes || "No additional notes"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReferralAction(referral.id, "accept")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#10B981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <CheckCircle size={14} /> Accept
                </button>
                <button
                  onClick={() => handleReferralAction(referral.id, "ignore")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#6B7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <XCircle size={14} /> Ignore
                </button>
                <button
                  onClick={() => handleReferralAction(referral.id, "block")}
                  style={{
                    padding: "8px 12px",
                    background: "#EF4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Ban size={14} /> Block
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MentorStatsCard({ stats }) {
  return (
    <Card title="Mentorship Stats">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <StatItem icon={Users} label="Students Helped" value={stats.students || 0} color="#6366F1" />
        <StatItem icon={CheckCircle} label="Projects Completed" value={stats.completed} color="#10B981" />
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "#FEF3C715",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Award size={20} color="#F59E0B" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "2px" }}>Reputation Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#111827" }}>{stats.reputation || 0}</div>
              <div style={{ 
                flex: 1, 
                height: "6px", 
                background: "#E5E7EB", 
                borderRadius: "3px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${stats.reputation || 0}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)"
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ==================== PROJECT DETAILS MODAL ====================

function ProjectDetailsModal({ project, onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "80vh",
        overflowY: "auto",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            padding: "8px"
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>
          {project.title}
        </h2>
        
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6", marginBottom: "24px" }}>
          {project.description}
        </p>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>PROJECT DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <InfoItem icon={TrendingUp} label="Total Score" value={project.total_score} />
            <InfoItem icon={Users} label="Team Members" value={project.members.length} />
            <InfoItem 
              icon={CheckCircle} 
              label="Status" 
              value={project.published ? "Completed" : "Active"} 
            />
            {project.repo_url && (
              <div style={{ gridColumn: "1 / -1" }}>
                <a 
                  href={project.repo_url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: "#374151",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}
                >
                  <Github size={16} />
                  View Repository
                  <ExternalLink size={12} style={{ marginLeft: "auto" }} />
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "12px" }}>TEAM MEMBERS & SCORES</div>
          {project.members.length === 0 ? (
            <EmptyState message="No members yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {project.members.map((member, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#F9FAFB",
                  borderRadius: "6px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>
                        Student ID: {member.student_id}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>
                        Joined: {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#10B981" }}>
                      {member.contribution_score}
                    </div>
                    {member.star_awarded && (
                      <Award size={14} color="#F59E0B" fill="#F59E0B" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== ADMIN COMPONENTS ====================

function AdminControlsSection() {
  return (
    <Card title="Admin Controls">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <ActionButton icon={CheckCircle} label="Approve Alumni" color="#10B981" />
        <ActionButton icon={Ban} label="Ban Users" color="#EF4444" />
        <ActionButton icon={FileText} label="View Audits" color="#6366F1" />
        <ActionButton icon={TrendingUp} label="Manage Scores" color="#F59E0B" />
      </div>
    </Card>
  );
}

function PlatformStatsSection({ projects }) {
  return (
    <Card title="Platform Overview">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#6366F1" }}>{projects.length}</div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Total Projects</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#10B981" }}>
            {projects.filter(p => p.published).length}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Completed</div>
        </div>
      </div>
    </Card>
  );
}

function AdminQuickActionsCard() {
  return (
    <Card title="Quick Actions">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
        <a href="/admin" style={{ color: "#6366F1", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
          <ExternalLink size={14} />
          Go to Admin Panel
        </a>
      </div>
    </Card>
  );
}

// ==================== SHARED COMPONENTS ====================

function ProfileHeader({ profile, user, isEditing, onToggleEdit, onCancel, onChange }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "32px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {/* Profile Photo */}
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            fontWeight: "bold",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            position: "relative"
          }}>
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
            {isEditing && (
              <div style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "#6366F1",
                borderRadius: "50%",
                padding: "6px",
                cursor: "pointer"
              }}>
                <Upload size={14} color="#fff" />
              </div>
            )}
          </div>

          {/* Name & Details */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  padding: "4px 8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  width: "300px"
                }}
              />
            ) : (
              <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" }}>
                {profile.name}
              </h1>
            )}
            
            {/* Role Badge */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span style={{
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "600",
                background: user?.role === "student" ? "#DBEAFE" : user?.role === "alumni" ? "#EDE9FE" : "#FEE2E2",
                color: user?.role === "student" ? "#1E40AF" : user?.role === "alumni" ? "#6B21A8" : "#991B1B"
              }}>
                {user?.role === "student" ? "Student" : user?.role === "alumni" ? "Alumni / Mentor" : "Admin"}
              </span>
              {user?.role === "alumni" && profile.company && (
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  background: "#F3F4F6",
                  color: "#6B7280"
                }}>
                  {profile.company}
                </span>
              )}
            </div>

            {/* Bio Preview (non-edit mode) */}
            {!isEditing && (
              <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, maxWidth: "600px" }}>
                {profile.bio || "No bio added yet"}
              </p>
            )}
          </div>
        </div>

        {/* Edit Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          {isEditing && (
            <button
              onClick={onCancel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              <X size={16} />
              Cancel
            </button>
          )}
          <button
            onClick={onToggleEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              background: isEditing ? "#6366F1" : "#fff",
              color: isEditing ? "#fff" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }}>
      {title && (
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Icon size={16} color="#9CA3AF" />
      <div>
        <div style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </div>
        <div style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#111827" }}>{value}</div>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, href }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 12px",
      background: "#F9FAFB",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      textDecoration: "none",
      color: "#374151",
      fontSize: "13px",
      fontWeight: "500",
      transition: "background 0.2s"
    }}>
      <Icon size={16} />
      {label}
      <ExternalLink size={12} style={{ marginLeft: "auto" }} />
    </a>
  );
}

function ActionButton({ icon: Icon, label, color }) {
  return (
    <button style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px",
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: "8px",
      color: color,
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600"
    }}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "32px",
      color: "#9CA3AF",
      fontSize: "14px"
    }}>
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
      Loading profile...
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>
      Profile not found
    </div>
  );
}

// ==================== HELPERS ====================

function calculateStats(user, projects, profile) {
  if (user?.role === "student") {
    const totalScore = projects.reduce((sum, p) => {
      const member = p.members.find(m => m.student_id === user.id);
      return sum + (member?.contribution_score || 0);
    }, 0);
    
    const stars = projects.filter(p =>
      p.members.find(m => m.student_id === user.id)?.star_awarded
    ).length;

    return {
      score: totalScore,
      stars,
      active: projects.filter(p => !p.published).length,
      completed: projects.filter(p => p.published).length
    };
  }

  if (user?.role === "alumni") {
    const students = new Set(projects.flatMap(p => p.members.map(m => m.student_id))).size;
    return {
      students,
      completed: projects.filter(p => p.published).length,
      active: projects.filter(p => !p.published).length,
      reputation: Math.min(100, projects.filter(p => p.published).length * 10)
    };
  }

  return {};
}
