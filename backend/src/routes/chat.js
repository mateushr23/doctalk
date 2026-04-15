const { Router } = require('express');
const Groq = require('groq-sdk');
const store = require('../store');

const router = Router();

let groq = null;

// Groq free tier: 12,000 TPM. Reserve room for history + response.
const MAX_CONTEXT_TOKENS = 8000;

function getGroqClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

/**
 * Estimate token count (~4 chars per token) and truncate if needed.
 */
function truncateToTokenLimit(text, maxTokens = MAX_CONTEXT_TOKENS) {
  const estimatedTokens = Math.ceil(text.length / 4);
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  const maxChars = maxTokens * 4;
  return (
    text.slice(0, maxChars) + '\n\n[Document truncated to fit context window]'
  );
}

router.post('/', async (req, res) => {
  const { sessionId, message, history } = req.body;

  // Validate sessionId
  if (!sessionId || !store.has(sessionId)) {
    return res.status(404).json({
      error: 'Session not found. Please upload your PDF again.',
    });
  }

  // Validate message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      error: 'Type a question before sending.',
    });
  }

  if (message.length > 10000) {
    return res.status(400).json({
      error: 'Message is too long. Please keep it under 10,000 characters.',
    });
  }

  const session = store.get(sessionId);
  const pdfText = truncateToTokenLimit(session.text);

  // Build messages array
  const systemMessage = {
    role: 'system',
    content: `You are a helpful document assistant. Answer questions based on the following document content:\n\n${pdfText}\n\nAlways reference specific parts of the document when answering. If the answer is not in the document, say so clearly.`,
  };

  const messages = [systemMessage];

  // Append conversation history (only allow user/assistant roles)
  const allowedRoles = new Set(['user', 'assistant']);
  if (Array.isArray(history)) {
    for (const entry of history) {
      if (allowedRoles.has(entry.role) && entry.content) {
        messages.push({ role: entry.role, content: String(entry.content) });
      }
    }
  }

  // Append current user message
  messages.push({ role: 'user', content: message.trim() });

  // Create the stream BEFORE setting SSE headers so Groq errors return proper JSON
  let stream;
  try {
    stream = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
    });
  } catch (err) {
    console.error('Groq API error:', err.message, err.status, err.error || '');

    if (err.status === 429 || err.status === 413) {
      return res.status(413).json({
        error:
          'This PDF is too large for the AI to process. Try a shorter document.',
      });
    }

    if (err.status === 401 || err.status === 403) {
      return res.status(500).json({
        error: 'Something went wrong. Please try again.',
      });
    }

    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }

  // Stream confirmed — NOW set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (streamErr) {
    console.error('Stream error:', streamErr.message);
    res.write(
      `data: ${JSON.stringify({ content: '', done: true, error: 'The response was interrupted. Send your question again.' })}\n\n`
    );
    res.end();
  }
});

module.exports = router;
