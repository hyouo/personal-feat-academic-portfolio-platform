import React, { useState, useEffect } from 'react';
import api, { downloadAttachment } from '../services/api';

function FileLibraryPage() {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parentInfo, setParentInfo] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch all attachments
        const attachmentsRes = await api.get('/attachments');
        const allAttachments = attachmentsRes.data.data || [];
        setAttachments(allAttachments);

        // Fetch details for all unique parent items to display their names
        const parentIds = {
          publication: new Set(),
          project: new Set(),
        };
        allAttachments.forEach(att => {
          if (parentIds[att.parent_type] && att.parent_id) {
            parentIds[att.parent_type].add(att.parent_id);
          }
        });

        const parentData = {};
        const publicationRes = await api.get('/publications');
        publicationRes.data.data.forEach(p => parentData[`publication-${p.id}`] = p.title);

        const projectRes = await api.get('/projects');
        projectRes.data.data.forEach(p => parentData[`project-${p.id}`] = p.name);

        setParentInfo(parentData);

      } catch (err) {
        console.error('Failed to load file library', err);
        setError('Could not load files.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleDelete = async (attachmentId) => {
    if (window.confirm('Are you sure you want to delete this attachment? This is permanent.')) {
      try {
        await api.delete(`/attachments/${attachmentId}`);
        setAttachments(attachments.filter(att => att.id !== attachmentId));
      } catch (err) {
        console.error('Failed to delete attachment', err);
        setError('Could not delete the attachment.');
      }
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>
      <h3>File Library</h3>
      <p>A central place to view all uploaded files.</p>

      {loading && <p>Loading files...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>File Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Attached To</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map(att => (
            <tr key={att.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button type="button" onClick={() => downloadAttachment(att).catch(() => setError('Could not download attachment.'))}>
                  {att.original_name}
                </button>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{att.description}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {parentInfo[`${att.parent_type}-${att.parent_id}`] || `${att.parent_type} #${att.parent_id}`}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{att.is_public ? 'Public' : 'Private'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button onClick={() => handleDelete(att.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FileLibraryPage;