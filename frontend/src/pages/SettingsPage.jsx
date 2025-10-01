import React, { useState, useEffect } from 'react';
import api from '../services/api';

function SettingsPage() {
  const [moduleOrder, setModuleOrder] = useState([]);
  const [theme, setTheme] = useState('default');
  const [font, setFont] = useState('sans-serif'); // New state for font
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [orderRes, themeRes, fontRes] = await Promise.all([
          api.get('/settings/module_order'),
          api.get('/settings/theme'),
          api.get('/settings/font')
        ]);
        setModuleOrder(orderRes.data.value);
        setTheme(themeRes.data.value);
        setFont(fontRes.data.value);
      } catch (err) {
        console.error('Failed to fetch settings', err);
        setError('Could not load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const moveModule = (index, direction) => {
    const newOrder = [...moduleOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setModuleOrder(newOrder);
  };

  const handleSaveChanges = async () => {
    setMessage('');
    setError('');
    try {
      await Promise.all([
        api.post('/settings/module_order', { value: moduleOrder }),
        api.post('/settings/theme', { value: theme }),
        api.post('/settings/font', { value: font }) // Save font setting
      ]);
      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings', err);
      setError('Failed to save settings.');
    }
  };

  const moduleDisplayNames = { 'education': 'Education', 'work': 'Work Experience', 'teaching': 'Teaching Experience', 'publications': 'Publications', 'projects': 'Projects', 'honors': 'Honors & Awards', 'skills': 'Skills' };

  if (loading) return <p>Loading settings...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>

      <h3>Appearance Customization</h3>
      <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '10px' }}>Color Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: '8px', fontSize: '1rem' }}>
            <option value="default">Default Light</option>
            <option value="dark">Academic Dark</option>
            <option value="blue">Scholarly Blue</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '10px' }}>Typography</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label><input type="radio" name="font" value="sans-serif" checked={font === 'sans-serif'} onChange={(e) => setFont(e.target.value)} /> Modern (Sans-serif)</label>
            <label><input type="radio" name="font" value="serif" checked={font === 'serif'} onChange={(e) => setFont(e.target.value)} /> Classic (Serif)</label>
          </div>
        </div>
      </div>

      <hr style={{margin: '30px 0'}}/>

      <h3>Customize Public Page Layout</h3>
      <p>Change the order in which sections appear on your public portfolio page.</p>
      <ul style={{ listStyle: 'none', padding: 0, border: '1px solid #ccc', borderRadius: '4px' }}>
        {moduleOrder.map((moduleKey, index) => (
          <li key={moduleKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: index < moduleOrder.length - 1 ? '1px solid #eee' : 'none' }}>
            <span>{moduleDisplayNames[moduleKey] || moduleKey}</span>
            <div>
              <button onClick={() => moveModule(index, 'up')} disabled={index === 0} style={{ marginRight: '5px' }}>↑ Up</button>
              <button onClick={() => moveModule(index, 'down')} disabled={index === moduleOrder.length - 1}>↓ Down</button>
            </div>
          </li>
        ))}
      </ul>

      <button onClick={handleSaveChanges} style={{ marginTop: '20px' }}>Save All Settings</button>
      {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
    </div>
  );
}

export default SettingsPage;