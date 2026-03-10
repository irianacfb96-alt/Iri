const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.post('/api/groq', async (req, res) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Genera imagen: busca en loremflickr (fotos reales por keyword), fallback Picsum
app.get('/api/img', async (req, res) => {
  const prompt = req.query.p || 'business professional';
  const seed = parseInt(req.query.s || '1');
  const lock = (Math.abs(seed) % 9999) + 1;
  // loremflickr: free Flickr keyword search, real photos, no API key
  try {
    const keywords = prompt.replace(/\s+/g, ',').substring(0, 80);
    const flickrUrl = `https://loremflickr.com/540/960/${encodeURIComponent(keywords)}?lock=${lock}`;
    const imgRes = await fetch(flickrUrl, { redirect: 'follow' });
    if (imgRes.ok && imgRes.headers.get('content-type')?.startsWith('image/')) {
      const buffer = await imgRes.arrayBuffer();
      res.set('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    }
  } catch (e) {
    console.error('loremflickr error:', e.message);
  }
  // Fallback: foto aleatoria de Picsum (instantánea)
  try {
    const fallback = await fetch(`https://picsum.photos/540/960?random=${seed}`);
    const buffer = await fallback.arrayBuffer();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: 'All image sources failed' });
  }
});

// Descarga imagen por URL
app.get('/api/image', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url param' });
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Content-Disposition', 'attachment');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Image proxy error', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));
