import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import useAuth from "../../hooks/useAuth";
import { fetchApi } from "../../hooks/useFetch";
import bgImage from "../../assets/avatars/image.png";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [externalId, setExternalId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const demoAccounts = [
    { email: "student@vnrvjiet.in", password: "demo123", role: "Student", id: "STU001" },
    { email: "mentor@vnrvjiet.in", password: "demo123", role: "Alumni", id: "ALU001" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.endsWith("@vnrvjiet.in")) {
      setError("Only @vnrvjiet.in email addresses are allowed");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignup) {
        await fetchApi("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, role, external_id: externalId, name }),
        });
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        const userData = await fetchApi("/auth/login", {
          method: "POST",
          body: JSON.stringify({ token: idToken }),
        });
        login(idToken, userData.user);
        if (role === "alumni") {
          alert("Registration successful! Your account is pending admin approval.");
        } else {
          navigate("/dashboard");
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        const userData = await fetchApi("/auth/login", {
          method: "POST",
          body: JSON.stringify({ token: idToken }),
        });
        login(idToken, userData.user);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || (isSignup ? "Registration failed" : "Invalid credentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setIsSignup(false);
    setError("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .login-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url(${bgImage});
          background-size: cover;
          background-position: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }


        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 36px;
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 22px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .login-title {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: #f0f0ff;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .login-subtitle {
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
        }

        .login-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          animation: shake 0.3s ease;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px;
          margin-bottom: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #f0f0ff;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }

        .login-input::placeholder { color: rgba(255,255,255,0.25); }

        .login-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.07);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .login-input option {
          background: #1a1a2e;
          color: #f0f0ff;
        }

        .login-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: -10px;
          margin-bottom: 14px;
          line-height: 1.4;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.2px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.45);
        }

        .login-btn:active:not(:disabled) { transform: translateY(0); }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-toggle-row {
          text-align: center;
          margin-top: 18px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }

        .login-toggle-btn {
          background: transparent;
          border: none;
          color: #818cf8;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          margin-left: 4px;
          transition: color 0.2s;
        }

        .login-toggle-btn:hover { color: #a5b4fc; text-decoration: underline; }

        .demo-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .demo-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-align: center;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .demo-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 11px 14px;
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }

        .demo-card:hover {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.07);
          transform: translateX(2px);
        }

        .demo-role { font-size: 13px; font-weight: 600; color: #e0e0ff; margin-bottom: 2px; }
        .demo-email { font-size: 11px; color: rgba(255,255,255,0.35); }

        .demo-badge {
          font-size: 10px;
          padding: 3px 9px;
          border-radius: 20px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .badge-student { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .badge-alumni  { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }

        .login-footer {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          text-align: center;
          margin-top: 20px;
          line-height: 1.6;
        }
      `}</style>

      <div className="login-root">
        <div className="login-grid" />

        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">⬡</div>

          <h1 className="login-title">The Obsidian Circle</h1>
          <p className="login-subtitle">College Mentorship Platform · VNR VJIET</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <label className="login-label">Full Name</label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </>
            )}

            <label className="login-label">VNR Email</label>
            <input
              className="login-input"
              type="email"
              placeholder="you@vnrvjiet.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {isSignup && (
              <>
                <label className="login-label">Role</label>
                <select
                  className="login-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni (Requires Approval)</option>
                </select>

                <label className="login-label">
                  {role === "student" ? "Student ID" : "Alumni ID"}
                </label>
                <input
                  className="login-input"
                  type="text"
                  placeholder={role === "student" ? "2024-CSE-0001" : "ALU-2020-0001"}
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  required
                />
                <p className="login-hint">
                  {role === "student"
                    ? "Format: YYYY-DEPT-XXXX"
                    : "Format: ALU-YYYY-XXXX"}
                </p>
              </>
            )}

            <button className="login-btn" type="submit" disabled={isLoading}>
              {isLoading && <span className="login-btn-spinner" />}
              {isLoading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="login-toggle-row">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button className="login-toggle-btn" type="button" onClick={() => { setIsSignup(!isSignup); setError(""); }}>
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </div>

          {!isSignup && (
            <div className="demo-section">
              <p className="demo-label">Quick Demo ↓</p>
              {demoAccounts.map((account, i) => (
                <div key={i} className="demo-card" onClick={() => fillDemoCredentials(account)}>
                  <div>
                    <div className="demo-role">{account.role}</div>
                    <div className="demo-email">{account.email}</div>
                  </div>
                  <span className={`demo-badge ${account.role === "Student" ? "badge-student" : "badge-alumni"}`}>
                    {account.id}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="login-footer">
            Only @vnrvjiet.in emails · Alumni require admin approval
          </p>
        </div>
      </div>
    </>
  );
}
