import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/books", { replace: true });
    }
  }, [loading, user, navigate]);

  const onGoogleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/api/auth/google`);
  };

  return (
    <div className="library-login">
      <section className="library-login__hero">
        <p className="library-login__eyebrow">Mini Library</p>
        <h1 className="library-login__headline">Welcome back to your lobby.</h1>
        <p className="library-login__subhead">
          Manage your catalog, track availability, and help members find the
          right book faster.
        </p>
        <ul className="library-login__highlights">
          <li>Unified search across titles, authors, and tags.</li>
          <li>Role-based tools for librarians and admins.</li>
          <li>AI assistant support for discovery and summaries.</li>
        </ul>
      </section>

      <section className="library-login__panel">
        <div className="library-login__card">
          <span className="library-login__kicker">Secure access</span>
          <h2 className="library-login__title">Sign in</h2>
          <p className="library-login__description">
            Use Google SSO to continue to Mini Library.
          </p>

          <Button
            type="button"
            className="library-google-btn"
            onClick={onGoogleSignIn}
            disabled={loading}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="library-google-btn__icon"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 0.8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8 6.9 2.8 2.8 7 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.5z"
              />
              <path
                fill="#FBBC05"
                d="M2.8 7.1l3.2 2.3C6.8 7.4 9.1 5.9 12 5.9c1.8 0 3 0.8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8c-3.5 0-6.6 2-8.1 4.9z"
              />
              <path
                fill="#34A853"
                d="M12 21.2c2.4 0 4.4-.8 5.9-2.1l-2.7-2.2c-.7.5-1.8.9-3.2.9-3.7 0-5.1-2.4-5.4-3.6l-3.1 2.4c1.5 3 4.6 4.6 8.5 4.6z"
              />
              <path
                fill="#4285F4"
                d="M21.8 12.3c0-.6-.1-1.1-.2-1.5H12v3.9h5.4c-.3 1.4-1.1 2.5-2.1 3.1l2.7 2.2c1.6-1.5 3-3.9 3-7.7z"
              />
            </svg>
            <span>{loading ? "Checking session..." : "Continue with Google"}</span>
          </Button>

          <p className="library-login__trust">
            Secure Google SSO | No password stored
          </p>
        </div>
      </section>
    </div>
  );
}
