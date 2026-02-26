import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Row,
  Col,
  Spinner,
  Table,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function StatusBadge({ status }) {
  const variant = status === 'AVAILABLE' ? 'success' : 'secondary';
  return <Badge bg={variant}>{status}</Badge>;
}

export default function BooksListPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [availability, setAvailability] = useState('ALL');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const canManageBooks = user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN');
  const isAdmin = user && user.role === 'ADMIN';

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: q || undefined,
        availability: availability !== 'ALL' ? availability : undefined,
        genre: genre || undefined,
        year: year || undefined,
        page,
        limit,
        sort,
        order,
      };
      const res = await api.get('/api/books', { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sort, order]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await fetchBooks();
  };

  const checkout = async (bookId) => {
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/books/${bookId}/checkout`, {});
      setSuccess('Checked out successfully.');
      await fetchBooks();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  const checkin = async (bookId) => {
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/api/books/${bookId}/checkin`);
      setSuccess('Checked in successfully.');
      await fetchBooks();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/books/${deleteTarget._id}`);
      setSuccess('Book deleted.');
      setDeleteTarget(null);
      await fetchBooks();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h2 className="mb-0">Books</h2>
        </Col>
        <Col className="text-end">
          {canManageBooks ? (
            <Button as={Link} to="/books/new">
              Add Book
            </Button>
          ) : null}
        </Col>
      </Row>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <Form onSubmit={onSearch} className="mb-3">
        <Row className="g-2">
          <Col md={4}>
            <InputGroup>
              <Form.Control
                placeholder="Search title/author/isbn/tags/genre"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" variant="outline-primary">
                Search
              </Button>
            </InputGroup>
          </Col>
          <Col md={2}>
            <Form.Select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="BORROWED">Borrowed</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Control
              placeholder="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Control
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Row className="g-2">
              <Col>
                <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="createdAt">Created</option>
                  <option value="title">Title</option>
                </Form.Select>
              </Col>
              <Col>
                <Form.Select value={order} onChange={(e) => setOrder(e.target.value)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </Form.Select>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Year</th>
              <th>Status</th>
              <th style={{ width: 280 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b._id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.genre || '-'}</td>
                <td>{b.year || '-'}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="d-flex gap-2 flex-wrap">
                  <Button as={Link} to={`/books/${b._id}`} size="sm" variant="outline-primary">
                    View
                  </Button>
                  {canManageBooks ? (
                    <Button as={Link} to={`/books/${b._id}/edit`} size="sm" variant="outline-secondary">
                      Edit
                    </Button>
                  ) : null}
                  {isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setDeleteTarget(b)}
                    >
                      Delete
                    </Button>
                  ) : null}

                  {b.status === 'AVAILABLE' ? (
                    <Button size="sm" onClick={() => checkout(b._id)}>
                      Checkout
                    </Button>
                  ) : null}

                  {b.status === 'BORROWED' && canManageBooks ? (
                    <Button size="sm" variant="success" onClick={() => checkin(b._id)}>
                      Checkin
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2 align-items-center">
          <span className="text-muted small">Page {page} of {totalPages}</span>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="text-muted small">Per page</span>
          <Form.Select
            size="sm"
            style={{ width: 100 }}
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

