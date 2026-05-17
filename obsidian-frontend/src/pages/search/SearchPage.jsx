import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../hooks/useFetch";
import { Search, User, Briefcase, Github, MapPin } from "lucide-react";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load default profiles on mount
    performSearch("");
  }, []);

  async function performSearch(searchQuery) {
    setLoading(true);
    try {
      const data = await fetchApi(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    performSearch(query);
  }

  return (
    <div style={{ padding: "32px", height: "100%", overflowY: "auto", background: "#F9FAFB" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>
        Search
      </h1>
      <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
        Find students, alumni, and projects across the platform
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#fff",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}>
          <Search size={20} color="#6B7280" />
          <input
            type="text"
            placeholder="Search for students, alumni, skills, or projects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "#111827"
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 20px",
              background: "#6366F1",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
          Searching...
        </div>
      ) : results.length === 0 && query ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #E5E7EB"
        }}>
          <p style={{ fontSize: "16px", color: "#6B7280" }}>No results found for "{query}"</p>
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {results.map(profile => (
            <ProfileCard key={profile.user_id} profile={profile} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #E5E7EB"
        }}>
          <Search size={48} color="#E5E7EB" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "16px", color: "#6B7280" }}>Start searching to find people</p>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile }) {
  const navigate = useNavigate();
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
      {/* Avatar & Name */}
      <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#fff",
          flexShrink: 0
        }}>
          {profile.name?.charAt(0) || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "2px" }}>
            {profile.name || "Unknown"}
          </h3>
          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>
            {profile.job_role || "User"}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p style={{
          fontSize: "13px",
          color: "#6B7280",
          lineHeight: "1.5",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {profile.bio}
        </p>
      )}

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#6B7280" }}>
        {profile.education && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={14} />
            {profile.education}
          </div>
        )}
        {profile.company && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={14} />
            {profile.company}
          </div>
        )}
      </div>

      {/* Tags/Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {profile.skills.slice(0, 3).map(skill => (
            <span key={skill} style={{
              background: "#EEF2FF",
              color: "#4F46E5",
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span style={{
              background: "#F3F4F6",
              color: "#6B7280",
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button 
          onClick={() => navigate(`/profile/${profile.user_id}`)}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#6366F1",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          View Profile
        </button>
        {profile.github_url && (
          <a
            href={profile.github_url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 12px",
              background: "#F9FAFB",
              color: "#374151",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            <Github size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
