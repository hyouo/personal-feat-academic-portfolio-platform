import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicPage from './pages/PublicPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ResumePreviewPage from './pages/ResumePreviewPage';
import BlogListPage from './pages/BlogListPage';
import SinglePostPage from './pages/SinglePostPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<SinglePostPage />} />

          {/* Special route for PDF generation preview */}
          <Route path="/resume-preview" element={<ResumePreviewPage />} />

          {/* Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* You can add more protected routes here within the /admin path */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;