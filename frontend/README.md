# DocTalk

Chat with your PDF documents using AI. Upload a PDF, ask questions, get real-time streaming answers.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, pdf-parse
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Infra:** Docker + Docker Compose

## Getting Started

```bash
# With Docker
docker compose up

# Without Docker
cd frontend && npm run dev
cd backend && npm start
```

## Project Structure

```
doctalk/
├── frontend/     # Next.js app
├── backend/      # Express API
└── docker-compose.yml
```
