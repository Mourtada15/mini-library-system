import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

function normalizeTags(str) {
  return str
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function BookFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    genre: '',
    tags: '',
    year: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/books/${id}`);
        const b = res.data;
        setForm({
          title: b.title || '',
          author: b.author || '',
          isbn: b.isbn || '',
          description: b.description || '',
          genre: b.genre || '',
          tags: b.tags?.length ? b.tags.join(', ') : '',
          year: b.year ? String(b.year) : '',
        });
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        description: form.description || null,
        genre: form.genre || null,
        tags: normalizeTags(form.tags),
        year: form.year ? parseInt(form.year, 10) : null,
      };

      if (isEdit) {
        await api.put(`/api/books/${id}`, payload);
        navigate(`/books/${id}`);
      } else {
        const res = await api.post('/api/books', payload);
        navigate(`/books/${res.data._id}`);
      }
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>{isEdit ? 'Edit Book' : 'Add Book'}</Card.Title>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form onSubmit={onSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Title</Form.Label>
                <Form.Control
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Author</Form.Label>
                <Form.Control
                  name="author"
                  value={form.author}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>ISBN</Form.Label>
                <Form.Control name="isbn" value={form.isbn} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Control name="year" value={form.year} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Genre</Form.Label>
                <Form.Control name="genre" value={form.genre} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tags (comma separated)</Form.Label>
                <Form.Control name="tags" value={form.tags} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={12} className="d-flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

