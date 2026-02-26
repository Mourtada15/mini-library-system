import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container py-4">
        <Alert variant="danger">
          <Alert.Heading>403 Forbidden</Alert.Heading>
          You do not have access to this page.
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
