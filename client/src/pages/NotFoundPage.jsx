import React from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Alert variant="warning">
      <Alert.Heading>Page not found</Alert.Heading>
      <p>
        Go back to <Link to="/books">Books</Link>.
      </p>
    </Alert>
  );
}

