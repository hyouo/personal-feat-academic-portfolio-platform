import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfileManager from '../components/ProfileManager';
import CrudManager from '../components/CrudManager';
import FileLibraryPage from './FileLibraryPage';
import SettingsPage from './SettingsPage';
import AnalyticsPage from './AnalyticsPage'; // Import the new Analytics page

function AdminDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [resumeSections, setResumeSections] = useState({ education: true, work: true, teaching: true, publications: true, projects: true, honors: true, skills: true, });

  const handleLogout = () => { auth.logout(); navigate('/login'); };
  const handleSectionToggle = (section) => { setResumeSections(prev => ({ ...prev, [section]: !prev[section] })); };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
        const sectionsToInclude = Object.keys(resumeSections).filter(key => resumeSections[key]);
        const response = await api.post('/resume/download', { sections: sectionsToInclude }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'resume.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setIsResumeModalOpen(false);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please check the console for details.');
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const modalStyles = { overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }, content: { background: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '500px' } };
  const allSectionKeys = ['education', 'work', 'teaching', 'publications', 'projects', 'honors', 'skills'];
  const sectionDisplayNames = { education: 'Education', work: 'Work Experience', teaching: 'Teaching Experience', publications: 'Publications', projects: 'Projects', honors: 'Honors & Awards', skills: 'Skills' };

  // --- Configurations for CrudManager ---
  const educationConfig = { sectionTitle: 'Education', apiEndpoint: '/education', formFields: [ { name: 'institution', label: 'Institution', type: 'text' }, { name: 'degree', label: 'Degree', type: 'text' }, { name: 'field_of_study', label: 'Field of Study', type: 'text' }, { name: 'start_date', label: 'Start Date', type: 'text' }, { name: 'end_date', label: 'End Date', type: 'text' }, ], displayColumns: [ { key: 'institution', header: 'Institution' }, { key: 'degree', header: 'Degree' } ] };
  const workExperienceConfig = { sectionTitle: 'Work Experience', apiEndpoint: '/work-experience', formFields: [ { name: 'company', label: 'Company', type: 'text' }, { name: 'position', label: 'Position', type: 'text' }, { name: 'start_date', label: 'Start Date', type: 'text' }, { name: 'end_date', label: 'End Date', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, ], displayColumns: [ { key: 'company', header: 'Company' }, { key: 'position', header: 'Position' } ] };
  const publicationsConfig = { sectionTitle: 'Publications', apiEndpoint: '/publications', parentType: 'publication', formFields: [ { name: 'title', label: 'Title', type: 'text' }, { name: 'authors', label: 'Authors', type: 'text' }, { name: 'journal_or_conference', label: 'Journal/Conference', type: 'text' }, { name: 'publication_date', label: 'Publication Date', type: 'text' }, { name: 'url', label: 'URL', type: 'text' }, ], displayColumns: [ { key: 'title', header: 'Title' }, { key: 'publication_date', header: 'Date' } ] };
  const projectsConfig = { sectionTitle: 'Projects', apiEndpoint: '/projects', parentType: 'project', formFields: [ { name: 'name', label: 'Project Name', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'start_date', label: 'Start Date', type: 'text' }, { name: 'end_date', label: 'End Date', type: 'text' }, { name: 'url', label: 'URL', type: 'text' }, ], displayColumns: [ { key: 'name', header: 'Name' } ] };
  const honorsConfig = { sectionTitle: 'Honors & Awards', apiEndpoint: '/honors', formFields: [ { name: 'title', label: 'Award Title', type: 'text' }, { name: 'issuer', label: 'Issued by', type: 'text' }, { name: 'date', label: 'Date', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, ], displayColumns: [ { key: 'title', header: 'Title' }, { key: 'date', header: 'Date' } ] };
  const teachingConfig = { sectionTitle: 'Teaching Experience', apiEndpoint: '/teaching', formFields: [ { name: 'course_name', label: 'Course Name', type: 'text' }, { name: 'institution', label: 'Institution', type: 'text' }, { name: 'role', label: 'Your Role', type: 'text' }, { name: 'date', label: 'Date/Semester', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, ], displayColumns: [ { key: 'course_name', header: 'Course' }, { key: 'role', header: 'Role' } ] };
  const skillsConfig = { sectionTitle: 'Skills', apiEndpoint: '/skills', formFields: [ { name: 'name', label: 'Skill Name', type: 'text' }, { name: 'category', label: 'Category (e.g., Programming Languages)', type: 'text' }, ], displayColumns: [ { key: 'name', header: 'Skill' }, { key: 'category', header: 'Category' } ] };
  const postsConfig = { sectionTitle: 'Blog Posts', apiEndpoint: '/posts', formFields: [ { name: 'title', label: 'Title', type: 'text' }, { name: 'publication_date', label: 'Publication Date', type: 'text' }, { name: 'content', label: 'Content', type: 'textarea' } ], displayColumns: [ { key: 'title', header: 'Title' }, { key: 'publication_date', header: 'Date' } ] };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Dashboard</h1>
        <div>
          <button onClick={() => setIsResumeModalOpen(true)} style={{ marginRight: '15px' }}>Generate PDF</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {isResumeModalOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <h3>Customize PDF Sections</h3>
            <p>Select the sections you want to include in your generated PDF resume.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0' }}>
              {allSectionKeys.map(key => (<label key={key}><input type="checkbox" checked={resumeSections[key]} onChange={() => handleSectionToggle(key)} />{sectionDisplayNames[key]}</label>))}
            </div>
            <button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? 'Generating...' : 'Generate and Download'}</button>
            <button onClick={() => setIsResumeModalOpen(false)} style={{ marginLeft: '10px' }} disabled={isGeneratingPdf}>Cancel</button>
          </div>
        </div>
      )}

      <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('content')} style={{ marginRight: '10px', padding: '10px', border: activeTab === 'content' ? 'none' : '1px solid transparent', borderBottom: activeTab === 'content' ? '2px solid var(--primary-color)' : 'none', background: 'none' }}>Content</button>
        <button onClick={() => setActiveTab('analytics')} style={{ marginRight: '10px', padding: '10px', border: activeTab === 'analytics' ? 'none' : '1px solid transparent', borderBottom: activeTab === 'analytics' ? '2px solid var(--primary-color)' : 'none', background: 'none' }}>Analytics</button>
        <button onClick={() => setActiveTab('files')} style={{ marginRight: '10px', padding: '10px', border: activeTab === 'files' ? 'none' : '1px solid transparent', borderBottom: activeTab === 'files' ? '2px solid var(--primary-color)' : 'none', background: 'none' }}>File Library</button>
        <button onClick={() => setActiveTab('settings')} style={{ padding: '10px', border: activeTab === 'settings' ? 'none' : '1px solid transparent', borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : 'none', background: 'none' }}>Settings</button>
      </nav>

      {activeTab === 'content' && (
        <div>
          <ProfileManager />
          <CrudManager {...educationConfig} />
          <CrudManager {...workExperienceConfig} />
          <CrudManager {...teachingConfig} />
          <CrudManager {...publicationsConfig} />
          <CrudManager {...projectsConfig} />
          <CrudManager {...honorsConfig} />
          <CrudManager {...skillsConfig} />
          <CrudManager {...postsConfig} />
        </div>
      )}

      {activeTab === 'analytics' && <AnalyticsPage />}
      {activeTab === 'files' && <FileLibraryPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </div>
  );
}

export default AdminDashboard;