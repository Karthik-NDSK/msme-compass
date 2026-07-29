import { Routes, Route, Navigate } from "react-router-dom";
import { getUser, getStoredBusiness } from "./lib/utils";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import TrackedSchemes from "./pages/TrackedSchemes";
import Profile from "./pages/Profile";

// Simple route guard
function RequireAuth({ children }) {
  const user = getUser();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function RequireBusiness({ children }) {
  const user = getUser();
  const business = getStoredBusiness();
  if (!user) return <Navigate to="/" replace />;
  if (!business) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/tracked"
        element={
          <RequireBusiness>
            <TrackedSchemes />
          </RequireBusiness>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireBusiness>
            <Profile />
          </RequireBusiness>
        }
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
