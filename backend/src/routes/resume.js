const express = require('express');
const router = express.Router();
const { generatePdf } = require('../services/pdfGenerator');

// POST /api/resume/download
// Triggers PDF generation based on a list of sections provided in the request body.
router.post('/download', async (req, res) => {
  const { sections } = req.body; // e.g., ['education', 'work', 'projects']

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: 'A list of sections to include is required.' });
  }

  try {
    console.log(`PDF generation requested for sections: ${sections.join(', ')}`);
    // Pass the sections to the PDF generator
    const pdfBuffer = await generatePdf(sections);
    console.log('PDF generated successfully.');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Failed to send PDF:', error);
    res.status(500).send('Error generating PDF resume. Please check server logs.');
  }
});

module.exports = router;