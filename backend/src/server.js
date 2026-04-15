require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const uploadRouter = require('./routes/upload');
const chatRouter = require('./routes/chat');
const errorHandler = require('./middleware/errorHandler');

// Validate GROQ_API_KEY on startup
if (!process.env.GROQ_API_KEY) {
  console.warn(
    'WARNING: GROQ_API_KEY is not set. Chat endpoint will fail without a valid API key.'
  );
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow frontend origin (configurable for Docker)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);

// JSON body parser
app.use(express.json());

// Multer config — memory storage, single file, 20MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/upload', upload.single('file'), uploadRouter);
app.use('/api/chat', chatRouter);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`DocTalk backend listening on port ${PORT}`);
});
