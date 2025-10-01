import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// This is a shared layout component for a clean, single-column view
const CenteredLayout = ({ children, title }) => (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>{title}</h1>
        {children}
    </div>
);

function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/posts/public');
        setPosts(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch posts', err);
        setError('Could not load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading posts...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;

  return (
    <CenteredLayout title="Blog">
      {posts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No posts have been published yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map(post => (
            <li key={post.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'var(--header-color)' }}>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>{post.title}</h2>
                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Published on: {post.publication_date}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CenteredLayout>
  );
}

export default BlogListPage;