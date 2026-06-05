// Load .env locally, but Render provides env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

const express  = require('express');
const path     = require('path');
const multer   = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app    = express();
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../app/Front-end')));

// Injeta variáveis públicas no frontend (sem expor a Gemini key)
app.get('/env.js', (_req, res) => {
  res.type('application/javascript');
  res.send(`
    window.ENV_SUPABASE_URL  = "${process.env.SUPABASE_URL || ''}";
    window.ENV_SUPABASE_KEY  = "${process.env.SUPABASE_ANON_KEY || ''}";
    window.ENV_GEMINI_KEY    = "${process.env.GEMINI_API_KEY || ''}";
  `);
});

const COACH_PROMPT = `És um treinador pessoal especializado em fitness e musculação chamado "Coach AI".
Respondes sempre em português de Portugal de forma clara e motivadora.
Quando sugeres exercícios indica sempre séries e repetições.
Sê conciso: máximo 3 parágrafos por resposta.
Usa emojis com moderação.`;

// ── Chat (gemini-3.1-flash-lite: 500 RPD grátis) ─────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: COACH_PROMPT,
    });
    const chat   = model.startChat({ history });
    const result = await chat.sendMessage(message);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao contactar a AI. Tenta novamente.' });
  }
});

// ── Análise de Foto (gemini-2.5-flash: suporte a imagens) ─
app.post('/api/analyze', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma foto recebida.' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `Analisa esta foto de progresso físico/fitness. Responde em português de Portugal com esta estrutura exata:

**Avaliação Geral**
Uma frase encorajadora sobre o progresso visível.

**Grupos Musculares**
Lista os principais grupos musculares visíveis e o nível de desenvolvimento de cada um.

**Onde Dar Mais Ênfase**
2 a 3 grupos que precisam de mais trabalho e porquê.

**Plano de Ação**
3 exercícios específicos para as áreas identificadas com séries e reps.

Sê honesto mas sempre positivo e motivador.`;

    const result = await model.generateContent([prompt, imagePart]);
    res.json({ analysis: result.response.text() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao analisar a foto. Tenta novamente.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🏋️  GymApp a correr em http://localhost:${PORT}\n`);
});
