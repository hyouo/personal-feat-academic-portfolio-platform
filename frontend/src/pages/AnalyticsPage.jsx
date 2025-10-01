import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AnalyticsPage() {
  const [pubStats, setPubStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/publication-stats');
        // Recharts expects numbers, so we ensure 'count' is a number
        const formattedData = response.data.data.map(item => ({
          ...item,
          count: Number(item.count)
        }));
        setPubStats(formattedData);
      } catch (err) {
        console.error('Failed to fetch publication stats', err);
        setError('Could not load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Analytics Dashboard</h3>

      <div style={{ marginTop: '30px' }}>
        <h4>Publications per Year</h4>
        {pubStats.length > 0 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={pubStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Publications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No publication data available to generate statistics.</p>
        )}
      </div>
      {/* More charts can be added here in the future */}
    </div>
  );
}

export default AnalyticsPage;