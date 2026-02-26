import React, { useEffect } from 'react';
import { Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/books', { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ maxWidth: 520 }} className="w-100">
        <Card.Body>
          <Card.Title>Sign in</Card.Title>
          <Card.Text className="text-muted">
            Use Google SSO to sign in.
          </Card.Text>
          <Button
            variant="primary"
            href={`${API_BASE_URL}/api/auth/google`}
          >
            Sign in with Google
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

