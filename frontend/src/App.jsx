import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import Vehicles from "./pages/Vehicles";
import Splash from "./pages/Splash";
import Explore from "./pages/Explore";
import ParkingDetails from "./pages/ParkingDetails";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { getToken } from "./services/api";

function PublicRoute({ children }) {
  const token = getToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function RootRedirect() {
  const token = getToken();
  // Logged-in users skip straight to the dashboard, as before.
  if (token) return <Navigate to="/dashboard" replace />;
  return <Splash />;
}

function App() {
  return (
    <Routes>
      {/* Public routes — redirect authenticated users to dashboard */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={<Navigate to="/bookings" replace />}
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parking/:id"
        element={
          <ProtectedRoute>
            <ParkingDetails />
          </ProtectedRoute>
        }
      />

      {/* Root & Catch-all redirects */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;