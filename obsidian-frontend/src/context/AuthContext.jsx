import { createContext, useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { fetchApi } from "../hooks/useFetch";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("session_token");
      if (token) {
        try {
          // Fetch current user's profile to get full user data
          const profileData = await fetchApi("/profiles/me");
          setUser({
            loggedIn: true,
            id: profileData.profile?.user_id,
            role: profileData.profile?.tags?.[0] || "student",
            email: localStorage.getItem("user_email") || "",
            profile: profileData.profile
          });
        } catch (err) {
          console.error("Auth check failed", err);
          localStorage.removeItem("session_token");
          localStorage.removeItem("user_email");
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("session_token", token);
    localStorage.setItem("user_email", userData.email);
    setUser({
      loggedIn: true,
      ...userData
    });
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Firebase signout error:", error);
    }
    
    // Clear local storage
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
