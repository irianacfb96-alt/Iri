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

// Genera imagen: busca en Lexica.art (AI, gratis, instantáneo), fallback Picsum
app.get('/api/img', async (req, res) => {
  const prompt = req.query.p || 'abstract colorful background';
  const seed = parseInt(req.query.s || '1');
  try {
    // Lexica.art: millones de imágenes AI pre-generadas por tema
    const search = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(prompt)}`, {
      headers: { 'User-Agent': 'StoryFlow/1.0' }
    });
    const data = await search.json();
    if (data.images && data.images.length > 0) {
      const pick = data.images[seed % data.images.length];
      const imgUrl = pick.src || pick.srcSmall;
      const imgRes = await fetch(imgUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        res.set('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(Buffer.from(buffer));
      }
    }
  } catch (e) {
    console.error('Lexica error:', e.message);
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
