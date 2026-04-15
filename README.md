# DocTalk

Chat with your PDF documents using AI-powered streaming responses.

![DocTalk](screenshot.png)

## Features

- Drag-and-drop PDF upload
- Real-time streaming AI responses (SSE)
- Conversation history within session
- Suggested starter questions
- Responsive design (mobile + desktop)
- Docker support

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion
- **Backend:** Node.js, Express, pdf-parse
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Icons:** Phosphor Icons
- **Infra:** Docker + Docker Compose

## Getting Started

### Without Docker

```bash
# Backend
cd backend
cp ../.env.example .env  # add your GROQ_API_KEY
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

### With Docker

```bash
cp .env.example .env  # add your GROQ_API_KEY
docker compose up
```

## Project Structure

```
doctalk/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── chat.js
│   │   │   └── upload.js
│   │   ├── server.js
│   │   └── store.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── EmptyState.tsx
│   │   └── lib/
│   │       └── sse.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GROQ_API_KEY | Yes | API key from [console.groq.com](https://console.groq.com) |
| NEXT_PUBLIC_API_URL | No | Backend URL, defaults to http://localhost:3001 |
| CORS_ORIGIN | No | Allowed CORS origin, defaults to http://localhost:3000 |
| PORT | No | Backend port, defaults to 3001 |

## License

MIT
