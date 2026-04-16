require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
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

// Security headers
app.use(helmet());

// Global rate limit: 100 requests per minute per IP
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// JSON body parser (capped at 100kb)
app.use(express.json({ limit: '100kb' }));

// Multer config — memory storage, single file, 20MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Route-specific rate limits
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: 'Too many uploads. Wait a moment and try again.' } });
const chatLimiter = rateLimit({ windowMs: 60_000, max: 20, message: { error: 'Too many requests. Wait a moment and try again.' } });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/upload', uploadLimiter, upload.single('file'), uploadRouter);
app.use('/api/chat', chatLimiter, chatRouter);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`DocTalk backend listening on port ${PORT}`);
});
