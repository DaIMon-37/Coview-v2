import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import GuestProfile from "./pages/GuestProfile";
import UserProfile from "./pages/UserProfile";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ViewingScreenChat from "./pages/ViewingScreenChat";
import JoinParty from "./pages/JoinParty";
import CreateParty from "./pages/CreateParty";
import PublicRooms from "./pages/PublicRooms";
import Premium from "./pages/Premium";
import History from "./pages/History";

const ProtectedRoute = ({ children }) => {
  const { user, sessionRestored } = useApp();
  const location = useLocation();
  if (!sessionRestored) return (
    <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/guest" element={<GuestProfile />} />
      <Route path="/rooms" element={<PublicRooms />} />
      <Route path="/premium" element={<Premium />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateParty /></ProtectedRoute>} />
      <Route path="/join" element={<ProtectedRoute><JoinParty /></ProtectedRoute>} />
      <Route path="/watch/chat" element={<ProtectedRoute><ViewingScreenChat /></ProtectedRoute>} />
      <Route path="/watch/:roomCode/chat" element={<ProtectedRoute><ViewingScreenChat /></ProtectedRoute>} />
      <Route path="/watch/:roomCode" element={<ProtectedRoute><ViewingScreenChat /></ProtectedRoute>} />
      <Route path="/watch" element={<ProtectedRoute><ViewingScreenChat /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
