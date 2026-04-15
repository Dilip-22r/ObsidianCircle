import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import useAuth from "./hooks/useAuth";

// Lazy load components for better performance
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const CommunitiesPage = lazy(() => import("./pages/communities/CommunitiesPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/projects/ProjectsPage"));
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
const ReferralsPage = lazy(() => import("./pages/referrals/ReferralsPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const MessagesPage = lazy(() => import("./pages/messages/MessagesPage"));

// Loading component for lazy routes
function LoadingSpinner() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#F9FAFB'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #6366F1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/auth" />;
}

export default function App() {
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        } 
      />

      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route 
          path="dashboard" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <DashboardPage />
            </Suspense>
          } 
        />
        <Route 
          path="projects" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ProjectsPage />
            </Suspense>
          } 
        />
        <Route 
          path="communities" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <CommunitiesPage />
            </Suspense>
          } 
        />
        <Route 
          path="messages" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <MessagesPage />
            </Suspense>
          } 
        />
        <Route 
          path="messages/:userId" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <MessagesPage />
            </Suspense>
          } 
        />
        <Route 
          path="search" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SearchPage />
            </Suspense>
          } 
        />
        <Route 
          path="referrals" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ReferralsPage />
            </Suspense>
          } 
        />
        <Route 
          path="admin" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminPage />
            </Suspense>
          } 
        />
        <Route 
          path="profile" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ProfilePage />
            </Suspense>
          } 
        />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>
    </Routes>
  );
}
