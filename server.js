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
