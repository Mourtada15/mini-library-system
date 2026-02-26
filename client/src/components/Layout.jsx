import React from "react";
import { Container, Nav, Navbar, Button, Image } from "react-bootstrap";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/books">
            Mini Library
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/books">
                Books
              </Nav.Link>
              <Nav.Link as={NavLink} to="/ai">
                AI Assistant
              </Nav.Link>
              {user?.role === "ADMIN" ? (
                <Nav.Link as={NavLink} to="/admin/users">
                  Admin
                </Nav.Link>
              ) : null}
            </Nav>

            {user ? (
              <div className="d-flex align-items-center gap-2">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    roundedCircle
                    width={32}
                    height={32}
                    alt={user.name}
                  />
                ) : null}
                <span className="text-light small">
                  {user.name} ({user.role})
                </span>
                <Button variant="outline-light" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            ) : null}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="pb-5">
        <Outlet />
      </Container>
    </>
  );
}
