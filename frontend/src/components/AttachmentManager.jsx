import React, { useState, useEffect, useCallback } from 'react';
import api, { downloadAttachment } from '../services/api';

function AttachmentManager({ parentId, parentType }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');

  const fetchAttachments = useCallback(async () => {
    if (!parentId) return;
    try {
      setLoading(true);
      const response = await api.get(`/attachments/${parentType}/${parentId}`);
      setAttachments(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch attachments', err);
      setError('Could not load attachments.');
    } finally {
      setLoading(false);
    }
  }, [parentId, parentType]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('attachmentFile', selectedFile);
    formData.append('parent_id', parentId);
    formData.append('parent_type', parentType);
    formData.append('description', description);

    try {
      await api.post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Reset form and refresh list
      setSelectedFile(null);
      setDescription('');
      e.target.reset(); // Reset the file input
      fetchAttachments();
    } catch (err) {
      console.error('Failed to upload attachment', err);
      setError('Upload failed. Please try again.');
    }
  };

  const handleDelete = async (attachmentId) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await api.delete(`/attachments/${attachmentId}`);
        fetchAttachments(); // Refresh list
      } catch (err) {
        console.error('Failed to delete attachment', err);
        setError('Could not delete attachment.');
      }
    }
  };

  const handleTogglePublic = async (attachment) => {
    try {
        const updatedAttachment = { ...attachment, is_public: !attachment.is_public };
        await api.put(`/attachments/${attachment.id}`, {
            description: updatedAttachment.description,
            is_public: updatedAttachment.is_public
        });
        fetchAttachments(); // Refresh list
    } catch (err) {
        console.error('Failed to update attachment status', err);
        setError('Could not update attachment status.');
    }
  };

  if (!parentId) {
    return <p style={{color: '#888'}}>Save the item first to manage attachments.</p>;
  }

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ccc' }}>
      <h4>Attachments</h4>
      {loading && <p>Loading attachments...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Attachment List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {attachments.map(att => (
          <li key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #eee' }}>
            <button type="button" onClick={() => downloadAttachment(att).catch(() => setError('Could not download attachment.'))}>{att.original_name}</button>
            <div>
              <button onClick={() => handleTogglePublic(att)} style={{marginRight: '5px'}}>{att.is_public ? 'Public' : 'Private'}</button>
              <button onClick={() => handleDelete(att.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Upload Form */}
      <form onSubmit={handleUpload} style={{ marginTop: '20px' }}>
        <h5>Upload New Attachment</h5>
        <input type="file" onChange={handleFileChange} required />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{margin: '0 10px'}}
        />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default AttachmentManager;