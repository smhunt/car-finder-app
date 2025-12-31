import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3090;

// CORS for frontend
app.use(cors({
  origin: ['http://localhost:3016', 'https://carfinder.dev.ecoworks.ca'],
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy endpoint - fetches a URL and returns HTML
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  console.log(`[Proxy] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.status} ${response.statusText}`
      });
    }

    const html = await response.text();
    const finalUrl = response.url; // In case of redirects

    console.log(`[Proxy] Success: ${finalUrl} (${html.length} bytes)`);

    res.json({
      success: true,
      url: finalUrl,
      html,
      contentLength: html.length,
    });

  } catch (error) {
    console.error(`[Proxy] Error fetching ${url}:`, error.message);
    res.status(500).json({
      error: `Fetch failed: ${error.message}`
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Scraper proxy running on http://localhost:${PORT}`);
  console.log(`[Proxy] Endpoints:`);
  console.log(`  POST /api/scrape - Fetch and return page HTML`);
  console.log(`  GET  /health     - Health check`);
});
