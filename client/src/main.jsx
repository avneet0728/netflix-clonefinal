import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing.jsx";
import Login   from "./Login.jsx";
import Signup  from "./Signup.jsx";
import App     from "./App.jsx";
import Room    from "./room.jsx";
import "./index.css";

// Protected route — redirect to login if no token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("netflix_token");
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/"       element={<Landing />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route path="/home" element={
        <ProtectedRoute><App /></ProtectedRoute>
      } />
      <Route path="/room/:roomId" element={
        <ProtectedRoute><Room /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
