import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// This is a shared layout component for a clean, single-column view
const CenteredLayout = ({ children }) => (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
        {children}
    </div>
);

// --- Component to safely render HTML content ---
const RichTextDisplay = ({ content }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

function SinglePostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/posts/public/${slug}`);
        setPost(response.data.data);
      } catch (err) {
        console.error(`Failed to fetch post with slug: ${slug}`, err);
        setError('Post not found. It may have been moved or deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading post...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;
  if (!post) return null;

  return (
    <CenteredLayout>
        <article>
            <header style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.8rem', margin: '0 0 10px 0', color: 'var(--header-color)' }}>{post.title}</h1>
                <p style={{ margin: 0, color: '#888', fontSize: '1rem' }}>Published on: {post.publication_date}</p>
            </header>

            <div className="post-content" style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-color)' }}>
                <RichTextDisplay content={post.content} />
            </div>

            <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                <Link to="/blog">← Back to all posts</Link>
            </footer>
        </article>
    </CenteredLayout>
  );
}

export default SinglePostPage;