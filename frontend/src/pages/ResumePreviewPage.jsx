import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

// A custom hook to parse query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// --- Component to safely render HTML content ---
const RichTextDisplay = ({ content }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

// This component is designed to be rendered by Puppeteer on the backend.
// It formats the public data into a classic, printable resume layout.
function ResumePreviewPage() {
  const query = useQuery();
  const [profile, setProfile] = useState(null);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the sections to display from the URL query, or display all if not specified
  const sectionsToShow = query.get('sections')?.split(',') || ['education', 'work', 'teaching', 'publications', 'projects', 'honors', 'skills'];

  const styles = {
    page: { width: '210mm', minHeight: '297mm', padding: '20mm', margin: '0 auto', boxSizing: 'border-box', fontFamily: 'Georgia, serif', color: '#333', backgroundColor: '#fff', },
    header: { textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px', },
    h1: { fontSize: '24pt', margin: 0, },
    contact: { fontSize: '10pt', margin: '5px 0 0 0', },
    section: { marginBottom: '15px', },
    h2: { fontSize: '14pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', },
    item: { marginBottom: '10px', },
    itemHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 'bold', },
    subHeader: { fontStyle: 'italic', fontSize: '10pt', },
    description: { fontSize: '10pt', margin: '5px 0 0 0', paddingLeft: '15px', },
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [profileRes, eduRes, workRes, pubRes, projRes, honorsRes, teachingRes, skillsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/education/public'),
          api.get('/work-experience/public'),
          api.get('/publications/public'),
          api.get('/projects/public'),
          api.get('/honors/public'),
          api.get('/teaching/public'),
          api.get('/skills/public'),
        ]);

        setProfile(profileRes.data.data);
        setAllData({
          education: eduRes.data.data || [],
          work: workRes.data.data || [],
          publications: pubRes.data.data || [],
          projects: projRes.data.data || [],
          honors: honorsRes.data.data || [],
          teaching: teachingRes.data.data || [],
          skills: skillsRes.data.data || [],
        });
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const sections = {
      education: allData.education?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Education</h2>{allData.education.map(edu => <div key={edu.id} style={styles.item}><div style={styles.itemHeader}><span>{edu.institution}</span><span>{edu.start_date} - {edu.end_date}</span></div><div style={styles.subHeader}>{edu.degree}, {edu.field_of_study}</div></div>)}</section>,
      work: allData.work?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Work Experience</h2>{allData.work.map(w => <div key={w.id} style={styles.item}><div style={styles.itemHeader}><span>{w.company}</span><span>{w.start_date} - {w.end_date}</span></div><div style={styles.subHeader}>{w.position}</div><RichTextDisplay content={w.description} /></div>)}</section>,
      teaching: allData.teaching?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Teaching Experience</h2>{allData.teaching.map(t => <div key={t.id} style={styles.item}><div style={styles.itemHeader}><span>{t.course_name} at {t.institution}</span><span>{t.date}</span></div><div style={styles.subHeader}>{t.role}</div><RichTextDisplay content={t.description} /></div>)}</section>,
      publications: allData.publications?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Publications</h2>{allData.publications.map(pub => <div key={pub.id} style={styles.item}><div style={styles.itemHeader}><span>{pub.title}</span><span>{pub.publication_date}</span></div><div style={styles.subHeader}>{pub.journal_or_conference}</div><p style={styles.description}>{pub.authors}</p></div>)}</section>,
      projects: allData.projects?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Projects</h2>{allData.projects.map(proj => <div key={proj.id} style={styles.item}><div style={styles.itemHeader}><span>{proj.name}</span><span>{proj.start_date} - {proj.end_date}</span></div><RichTextDisplay content={proj.description} /></div>)}</section>,
      honors: allData.honors?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Honors & Awards</h2>{allData.honors.map(h => <div key={h.id} style={styles.item}><div style={styles.itemHeader}><span>{h.title}</span><span>{h.date}</span></div><div style={styles.subHeader}>{h.issuer}</div><RichTextDisplay content={h.description} /></div>)}</section>,
      skills: allData.skills?.length > 0 && <section style={styles.section}><h2 style={styles.h2}>Skills</h2>{allData.skills.map(s=><div key={s.id} style={styles.item}>{s.category}: {s.name}</div>)}</section>
  };

  if (loading) return <div>Loading Preview...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>{profile?.full_name}</h1>
        <p style={styles.contact}>
          {profile?.email} | {profile?.phone} | {profile?.linkedin_url} | {profile?.github_url}
        </p>
      </header>
      {profile?.bio && <section style={styles.section}><h2 style={styles.h2}>Summary</h2><RichTextDisplay content={profile.bio} /></section>}

      {sectionsToShow.map(key => sections[key] || null)}
    </div>
  );
}

export default ResumePreviewPage;