import React, { useState, useEffect } from 'react';
import api, { assetUrl } from '../services/api';
import RichTextEditor from './RichTextEditor'; // Import the Rich Text Editor

function ProfileManager() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    bio: '',
    profile_image_url: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/profile');
        if (response.data.data) {
          setProfile(response.data.data);
          if (response.data.data.profile_image_url) {
            setPreview(assetUrl(response.data.data.profile_image_url));
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setMessage('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleBioChange = (value) => {
      setProfile((prevProfile) => ({
        ...prevProfile,
        bio: value,
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    formData.append('full_name', profile.full_name || '');
    formData.append('email', profile.email || '');
    formData.append('phone', profile.phone || '');
    formData.append('linkedin_url', profile.linkedin_url || '');
    formData.append('github_url', profile.github_url || '');
    formData.append('bio', profile.bio || '');

    if (selectedFile) {
      formData.append('profileImage', selectedFile);
    }

    try {
      const response = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(response.data.data);
      if (response.data.data.profile_image_url) {
          setPreview(assetUrl(response.data.data.profile_image_url));
      }
      setSelectedFile(null);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Error updating profile. Please try again.');
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Manage Profile</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
            <label>Profile Image:</label>
            {preview && <img src={preview} alt="Profile Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', display: 'block', margin: '10px 0' }} />}
            <input type="file" name="profileImage" onChange={handleFileChange} accept="image/*" />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Full Name:</label>
          <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input type="email" name="email" value={profile.email || ''} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Phone:</label>
          <input type="text" name="phone" value={profile.phone || ''} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>LinkedIn URL:</label>
          <input type="text" name="linkedin_url" value={profile.linkedin_url || ''} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>GitHub URL:</label>
          <input type="text" name="github_url" value={profile.github_url || ''} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Bio/Summary:</label>
          <RichTextEditor value={profile.bio || ''} onChange={handleBioChange} />
        </div>
        <button type="submit">Save Profile</button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default ProfileManager;