import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BooksListPage from './pages/BooksListPage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import AiAssistantPage from './pages/AiAssistantPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/books' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/books" element={<BooksListPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />

            <Route element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']} />}>
              <Route path="/books/new" element={<BookFormPage />} />
              <Route path="/books/:id/edit" element={<BookFormPage />} />
            </Route>

            <Route path="/ai" element={<AiAssistantPage />} />

            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

