import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../services/api';

// Import theme and font stylesheets
import '../themes/default.css';
import '../themes/dark.css';
import '../themes/blue.css';
import '../index.css'; // For font definitions

// --- Reusable Section Component with Collapse/Expand ---
const Section = ({ title, sectionId, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  return (
    <section id={sectionId} style={{ marginBottom: '40px', scrollMarginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--header-color)', margin: 0 }}>{title}</h2>
        <button onClick={toggleCollapse} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
          {isCollapsed ? '⊕' : '⊖'}
        </button>
      </div>
      {!isCollapsed && <div>{children}</div>}
    </section>
  );
};

const Card = ({ children }) => (<div style={{ background: 'var(--card-background)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>{children}</div>);
const RichTextDisplay = ({ content }) => (<div style={{ color: 'var(--text-color)' }} dangerouslySetInnerHTML={{ __html: content || '' }} />);
const TableOfContents = ({ visibleSections, sectionDisplayNames }) => {
    const tocStyles = { position: 'fixed', top: '150px', left: '20px', width: '200px', background: 'var(--card-background)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', };
    const linkStyles = { display: 'block', color: 'var(--text-color)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s', };
    return (
        <nav style={tocStyles}>
            <h3 style={{ marginTop: 0, color: 'var(--header-color)' }}>Contents</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {visibleSections.map(key => (<li key={key}><a href={`#section-${key}`} style={linkStyles}>{sectionDisplayNames[key]}</a></li>))}
            </ul>
        </nav>
    );
};
const SkillsSection = ({ skills }) => {
    const groupedSkills = (skills || []).reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill.name);
        return acc;
    }, {});
    return (
        <Section title="Skills" sectionId="section-skills">
            {Object.entries(groupedSkills).map(([category, skillsList]) => (
                <div key={category} style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: 'var(--header-color)' }}>{category}</h4>
                    <p style={{ margin: 0, color: 'var(--text-color)' }}>{skillsList.join(', ')}</p>
                </div>
            ))}
        </Section>
    );
};

// --- Enhanced Attachment Components ---
const isImage = (fileName) => /\.(jpe?g|png|gif|webp)$/i.test(fileName);

const ImageGallery = ({ images }) => {
    if (!images || images.length === 0) return null;
    const galleryStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' };
    const imageStyle = { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' };
    return (
        <div style={galleryStyle}>
            {images.map(img => (
                <a key={img.id} href={assetUrl(img.file_url)} target="_blank" rel="noopener noreferrer">
                    <img src={assetUrl(img.file_url)} alt={img.description || img.original_name} style={imageStyle} />
                </a>
            ))}
        </div>
    );
};

const AttachmentList = ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;
    return (
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#555' }}>Documents:</h4>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {attachments.map(att => (
                    <li key={att.id} style={{ display: 'inline-block', marginRight: '15px' }}>
                        <a href={assetUrl(att.file_url)} target="_blank" rel="noopener noreferrer">{att.description || att.original_name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

function PublicPage() {
  const [profile, setProfile] = useState(null);
  const [allData, setAllData] = useState(null);
  const [moduleOrder, setModuleOrder] = useState([]);
  const [theme, setTheme] = useState('default');
  const [font, setFont] = useState('sans-serif');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [profileRes, eduRes, workRes, pubRes, projRes, honorsRes, teachingRes, skillsRes, settingsRes, themeRes, fontRes] = await Promise.all([
            api.get('/profile'), api.get('/education/public'), api.get('/work-experience/public'),
            api.get('/publications/public'), api.get('/projects/public'), api.get('/honors/public'),
            api.get('/teaching/public'), api.get('/skills/public'), api.get('/settings/module_order'),
            api.get('/settings/theme'), api.get('/settings/font'),
        ]);
        setProfile(profileRes.data.data);
        setAllData({
            education: eduRes.data.data || [], work: workRes.data.data || [], publications: pubRes.data.data || [],
            projects: projRes.data.data || [], honors: honorsRes.data.data || [], teaching: teachingRes.data.data || [],
            skills: skillsRes.data.data || [],
        });
        setModuleOrder(settingsRes.data.value || []);
        setTheme(themeRes.data.value || 'default');
        setFont(fontRes.data.value || 'sans-serif');
      } catch (err) {
        setError('Failed to load portfolio data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    const themeClass = `theme-${theme}`;
    const fontClass = `font-${font}`;
    document.body.classList.add(themeClass, fontClass);
    return () => { document.body.classList.remove(themeClass, fontClass); };
  }, [theme, font]);

  const filteredData = useMemo(() => {
    if (!allData) return {};
    if (!searchTerm) return allData;
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = {};
    for (const key in allData) {
        if (Array.isArray(allData[key])) {
            filtered[key] = allData[key].filter(item => Object.values(item).some(value => String(value).toLowerCase().includes(lowercasedFilter)));
        }
    }
    return filtered;
  }, [searchTerm, allData]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading portfolio...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;
  if (!allData) return null;

  const sectionDisplayNames = { education: 'Education', work: 'Work Experience', teaching: 'Teaching Experience', publications: 'Publications', projects: 'Projects', honors: 'Honors & Awards', skills: 'Skills' };
  const visibleSections = moduleOrder.filter(key => filteredData[key] && filteredData[key].length > 0);
  const sections = {
    education: <Section title="Education" sectionId="section-education">{(filteredData.education || []).map(edu => <Card key={edu.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{edu.degree}, {edu.field_of_study}</h3><p style={{ fontStyle: 'italic', margin: '5px 0', color: 'var(--text-color)' }}>{edu.institution}</p><p style={{ color: '#777', margin: 0 }}>{edu.start_date} - {edu.end_date}</p></Card>)}</Section>,
    work: <Section title="Work Experience" sectionId="section-work">{(filteredData.work || []).map(w => <Card key={w.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{w.position}</h3><p style={{ fontStyle: 'italic', margin: '5px 0', color: 'var(--text-color)' }}>{w.company}</p><p style={{ color: '#777', margin: '0 0 10px 0' }}>{w.start_date} - {w.end_date}</p><RichTextDisplay content={w.description} /></Card>)}</Section>,
    teaching: <Section title="Teaching Experience" sectionId="section-teaching">{(filteredData.teaching || []).map(t => <Card key={t.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{t.course_name}</h3><p style={{ fontStyle: 'italic', margin: '5px 0', color: 'var(--text-color)' }}>{t.institution} - {t.role}</p><p style={{ color: '#777', margin: '0 0 10px 0' }}>{t.date}</p><RichTextDisplay content={t.description} /></Card>)}</Section>,
    publications: <Section title="Publications" sectionId="section-publications">{(filteredData.publications || []).map(pub => <Card key={pub.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{pub.title}</h3><p style={{ margin: '5px 0', color: 'var(--text-color)' }}>{pub.authors}</p><p style={{ fontStyle: 'italic', margin: '0 0 10px 0', color: 'var(--text-color)' }}>{pub.journal_or_conference}, {pub.publication_date}</p>{pub.url && <a href={pub.url} target="_blank" rel="noopener noreferrer">View Publication</a>}<AttachmentList attachments={pub.attachments?.filter(att => !isImage(att.original_name))} /><ImageGallery images={pub.attachments?.filter(att => isImage(att.original_name))} /></Card>)}</Section>,
    projects: <Section title="Projects" sectionId="section-projects">{(filteredData.projects || []).map(proj => <Card key={proj.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{proj.name}</h3><p style={{ color: '#777', margin: '5px 0 10px 0' }}>{proj.start_date} - {proj.end_date}</p><RichTextDisplay content={proj.description} />{proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer">View Project</a>}<AttachmentList attachments={proj.attachments?.filter(att => !isImage(att.original_name))} /><ImageGallery images={proj.attachments?.filter(att => isImage(att.original_name))} /></Card>)}</Section>,
    honors: <Section title="Honors & Awards" sectionId="section-honors">{(filteredData.honors || []).map(h => <Card key={h.id}><h3 style={{ margin: 0, color: 'var(--header-color)' }}>{h.title}</h3><p style={{ fontStyle: 'italic', margin: '5px 0', color: 'var(--text-color)' }}>{h.issuer}</p><p style={{ color: '#777', margin: '0 0 10px 0' }}>{h.date}</p><RichTextDisplay content={h.description} /></Card>)}</Section>,
    skills: <SkillsSection skills={filteredData.skills} />,
  };

  return (
    <div style={{ display: 'flex' }}>
      {visibleSections.length > 0 && <TableOfContents visibleSections={visibleSections} sectionDisplayNames={sectionDisplayNames} />}
      <main style={{ marginLeft: '240px', flex: 1, padding: '20px' }}>
          <header style={{ textAlign: 'center', marginBottom: '50px' }}>
            {profile?.profile_image_url && <img src={assetUrl(profile.profile_image_url)} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />}
            <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--header-color)' }}>{profile?.full_name || 'Your Name'}</h1>
            {profile?.bio && <div style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 20px 0' }}><RichTextDisplay content={profile.bio} /></div>}
            <div className="social-links" style={{ marginBottom: '30px' }}>
              {profile?.email && <a href={`mailto:${profile.email}`} style={{ margin: '0 10px' }}>Email</a>}
              {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px' }}>LinkedIn</a>}
              {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px' }}>GitHub</a>}
              <Link to="/blog" style={{ margin: '0 10px' }}>Blog</Link>
            </div>
            <input
                type="text"
                placeholder="Search all content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px', width: '80%', maxWidth: '400px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem' }}
            />
          </header>
          {moduleOrder.map(key => (
            visibleSections.includes(key)
              ? React.cloneElement(sections[key], { key: key }) // MODIFICATION: Add key here
              : null
          ))}
      </main>
    </div>
  );
}

export default PublicPage;