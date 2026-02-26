import React, { useEffect, useState } from 'react';
import { Alert, Form, Spinner, Table } from 'react-bootstrap';
import api from '../api/client';

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [limit] = useState(20);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/users', { params: { page: 1, limit } });
      setUsers(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRole = async (userId, role) => {
    const prev = users;
    setUsers((u) => u.map((x) => (x._id === userId ? { ...x, role } : x)));
    try {
      await api.patch(`/api/users/${userId}/role`, { role });
    } catch (e) {
      setUsers(prev);
      setError(e?.response?.data?.message || e.message);
    }
  };

  return (
    <>
      <h2>Users</h2>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td style={{ width: 220 }}>
                  <Form.Select
                    value={u.role}
                    onChange={(e) => setRole(u._id, e.target.value)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="LIBRARIAN">LIBRARIAN</option>
                    <option value="MEMBER">MEMBER</option>
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

