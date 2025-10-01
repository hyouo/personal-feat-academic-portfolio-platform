const puppeteer = require('puppeteer');

// The base URL of the frontend's resume preview page.
const BASE_RESUME_URL = 'http://localhost:5173/resume-preview';

async function generatePdf(sections = []) {
  let browser;
  try {
    // Construct the full URL with query parameters
    const queryParams = new URLSearchParams({ sections: sections.join(',') });
    const fullUrl = `${BASE_RESUME_URL}?${queryParams}`;

    console.log(`Puppeteer navigating to: ${fullUrl}`);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Navigate to the resume page and wait for it to be fully loaded.
    await page.goto(fullUrl, {
      waitUntil: 'networkidle0',
    });

    // Generate the PDF from the page content.
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Could not generate the PDF resume.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generatePdf };