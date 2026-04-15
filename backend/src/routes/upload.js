const { Router } = require('express');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const store = require('../store');

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "This file isn't a PDF. Please upload a PDF document.",
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: "This file isn't a PDF. Please upload a PDF document.",
      });
    }

    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch (parseErr) {
      console.error('pdf-parse error:', parseErr);
      return res.status(422).json({
        error:
          'Could not read this PDF. The file may be corrupted or password-protected.',
      });
    }

    const sessionId = crypto.randomUUID();
    const filename = req.file.originalname;
    const pageCount = pdfData.numpages;
    const text = pdfData.text;
    const charCount = text.length;

    store.set(sessionId, { text, filename, pageCount });

    return res.json({ sessionId, filename, pageCount, charCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
