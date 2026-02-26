import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Row, Col, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function StatusBadge({ status }) {
  const variant = status === "AVAILABLE" ? "success" : "secondary";
  return <Badge bg={variant}>{status}</Badge>;
}

export default function BookDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManageBooks =
    user && (user.role === "ADMIN" || user.role === "LIBRARIAN");

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/books/${id}`);
      setBook(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkout = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/api/books/${id}/checkout`, {});
      setBook(res.data);
      setSuccess("Checked out.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  const checkin = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/api/books/${id}/checkin`);
      setBook(res.data);
      setSuccess("Checked in.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  const enrich = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post("/api/ai/enrich-book", { bookId: id });
      setBook(res.data);
      setSuccess("AI enrichment completed.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!book) return null;

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h2 className="mb-0">{book.title}</h2>
          <div className="text-muted">by {book.author}</div>
        </Col>
        <Col className="text-end">
          {canManageBooks ? (
            <Button
              as={Link}
              to={`/books/${id}/edit`}
              variant="outline-secondary"
            >
              Edit
            </Button>
          ) : null}
        </Col>
      </Row>

      {success ? <Alert variant="success">{success}</Alert> : null}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <div className="mb-2">
                <strong>Status:</strong> <StatusBadge status={book.status} />
              </div>
              <div className="mb-2">
                <strong>Genre:</strong> {book.genre || "-"}
              </div>
              <div className="mb-2">
                <strong>Year:</strong> {book.year || "-"}
              </div>
              <div className="mb-2">
                <strong>ISBN:</strong> {book.isbn || "-"}
              </div>
              <div className="mb-2">
                <strong>Tags:</strong>{" "}
                {book.tags?.length ? book.tags.join(", ") : "-"}
              </div>
              <div className="mb-2">
                <strong>Description:</strong>
                <div className="text-muted">{book.description || "-"}</div>
              </div>
            </Col>
            <Col md={4}>
              <Card className="bg-light">
                <Card.Body>
                  <div className="mb-2">
                    <strong>Borrower:</strong> {book.borrowedBy?.name || "-"}
                  </div>
                  <div className="mb-2">
                    <strong>Due:</strong>{" "}
                    {book.dueAt ? new Date(book.dueAt).toLocaleString() : "-"}
                  </div>
                  <div className="d-grid gap-2">
                    {book.status === "AVAILABLE" ? (
                      <Button onClick={checkout}>Checkout</Button>
                    ) : null}
                    {book.status === "BORROWED" && canManageBooks ? (
                      <Button variant="success" onClick={checkin}>
                        Checkin
                      </Button>
                    ) : null}
                    {canManageBooks ? (
                      <Button variant="outline-primary" onClick={enrich}>
                        Generate AI Tags/Summary
                      </Button>
                    ) : null}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>AI Summary</Card.Title>
          <div className="text-muted">
            {book.aiSummary || "No AI summary yet."}
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
