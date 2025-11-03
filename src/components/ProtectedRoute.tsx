import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";

// ✅ This component protects routes under Layout
export default function ProtectedRoute() {
  // Try Redux first, fallback to localStorage
  const token =
    useSelector((state: RootState) => state.auth.token) ||
    localStorage.getItem("auth_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If token exists, render nested routes (Layout + children)
  return <Outlet />;
}
