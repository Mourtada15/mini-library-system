import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AiAssistantPage() {
  const { user } = useAuth();
  const canEnrich =
    user && (user.role === "ADMIN" || user.role === "LIBRARIAN");

  const [query, setQuery] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState(null);
  const [smartExplanation, setSmartExplanation] = useState("");
  const [smartBooks, setSmartBooks] = useState([]);

  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichError, setEnrichError] = useState(null);
  const [enriched, setEnriched] = useState(null);

  const runSmartSearch = async () => {
    setSmartLoading(true);
    setSmartError(null);
    setSmartBooks([]);
    setSmartExplanation("");
    try {
      const res = await api.post("/api/ai/smart-search", { query });
      setSmartBooks(res.data.books || []);
      setSmartExplanation(res.data.explanation || "");
    } catch (e) {
      setSmartError(e?.response?.data?.message || e.message);
    } finally {
      setSmartLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const res = await api.get("/api/books", {
        params: { page: 1, limit: 50, sort: "createdAt", order: "desc" },
      });
      setBooks(res.data.data || []);
      if (!bookId && res.data.data && res.data.data[0])
        setBookId(res.data.data[0]._id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrichBook = async () => {
    setEnrichLoading(true);
    setEnrichError(null);
    setEnriched(null);
    try {
      const res = await api.post("/api/ai/enrich-book", { bookId });
      setEnriched(res.data);
      await loadBooks();
    } catch (e) {
      setEnrichError(e?.response?.data?.message || e.message);
    } finally {
      setEnrichLoading(false);
    }
  };

  return (
    <Row className="g-3">
      <Col md={7}>
        <Card>
          <Card.Body>
            <Card.Title>Smart Search</Card.Title>
            <Form.Group className="mb-2">
              <Form.Label>Natural language query</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "Available sci-fi books from the 1960s about desert planets"'
              />
            </Form.Group>
            <Button
              onClick={runSmartSearch}
              disabled={smartLoading || !query.trim()}
            >
              {smartLoading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Smart search"
              )}
            </Button>
            {smartError ? (
              <Alert variant="danger" className="mt-3">
                {smartError}
              </Alert>
            ) : null}
            {smartExplanation ? (
              <Alert variant="info" className="mt-3">
                {smartExplanation}
              </Alert>
            ) : null}
            {smartBooks.length ? (
              <Table striped bordered hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {smartBooks.map((b) => (
                    <tr key={b._id}>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </Card.Body>
        </Card>
      </Col>

      <Col md={5}>
        <Card>
          <Card.Body>
            <Card.Title>Enrich Book Metadata</Card.Title>
            {canEnrich ? (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Select a book</Form.Label>
                  <Form.Select
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                  >
                    {books.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title} — {b.author}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button
                  onClick={enrichBook}
                  disabled={enrichLoading || !bookId}
                >
                  {enrichLoading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Generate tags/genre/summary"
                  )}
                </Button>
                {enrichError ? (
                  <Alert variant="danger" className="mt-3">
                    {enrichError}
                  </Alert>
                ) : null}
                {enriched ? (
                  <Alert variant="success" className="mt-3">
                    Updated: <strong>{enriched.title}</strong>
                    <div className="mt-2">
                      <div>
                        <strong>Genre:</strong> {enriched.genre || "-"}
                      </div>
                      <div>
                        <strong>Tags:</strong>{" "}
                        {enriched.tags?.length ? enriched.tags.join(", ") : "-"}
                      </div>
                      <div className="mt-2">
                        <strong>Summary:</strong> {enriched.aiSummary || "-"}
                      </div>
                    </div>
                  </Alert>
                ) : null}
              </>
            ) : (
              <Alert variant="warning">
                Only ADMIN/LIBRARIAN can enrich a book.
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
