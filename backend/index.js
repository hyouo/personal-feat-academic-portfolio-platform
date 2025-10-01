require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initialize } = require('./src/db/database.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const educationRoutes = require('./src/routes/education');
const workExperienceRoutes = require('./src/routes/work_experience');
const publicationRoutes = require('./src/routes/publications');
const projectRoutes = require('./src/routes/projects');
const resumeRoutes = require('./src/routes/resume');
const attachmentRoutes = require('./src/routes/attachments');
const honorsRoutes = require('./src/routes/honors');
const teachingRoutes = require('./src/routes/teaching');
const skillsRoutes = require('./src/routes/skills');
const settingsRoutes = require('./src/routes/settings');
const postsRoutes = require('./src/routes/posts');
const analyticsRoutes = require('./src/routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/work-experience', workExperienceRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/honors', honorsRoutes);
app.use('/api/teaching', teachingRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Server Startup ---
async function startServer() {
  try {
    // Check for essential environment variables before doing anything else
    const requiredEnvVars = ['ADMIN_PASSWORD', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`FATAL ERROR: Missing required environment variables: ${missingVars.join(', ')}. Please create or check your .env file.`);
    }

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log(`Uploads directory created at: ${uploadsDir}`);
    }

    // Initialize the database
    await initialize();
    console.log('Database has been initialized successfully.');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error.message); // Log the specific error message
    process.exit(1); // Exit with a failure code
  }
}

startServer();

module.exports = app;