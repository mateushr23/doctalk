# DocTalk

Converse com seus PDFs: upload drag-and-drop, extração de texto com pdf-parse e respostas da LLM transmitidas token a token via Server-Sent Events — sem espera, sem polling. Janela de contexto gerenciada com truncamento por estimativa de tokens (8k TPM do Groq free), tratamento explícito do 413/429 quirk do rate-limit, e system prompt blindado contra prompt injection vindo do próprio documento.

## Recursos

- Upload drag-and-drop com extração de texto via `pdf-parse` e armazenamento em memória por sessão
- Resposta em streaming: o token chega no cliente assim que o Groq o emite, via Server-Sent Events
- Janela de contexto gerenciada por estimativa de tokens, truncando histórico antes de estourar o limite do modelo
- Tratamento explícito do quirk do Groq free tier: rate limit por TPM retorna 413 com `code: rate_limit_exceeded` em vez do 429 tradicional — o backend normaliza para 429
- System prompt blindado contra prompt injection vindo do conteúdo do PDF (instrução explícita de ignorar comandos embutidos no documento e nunca revelar o system prompt)
- Hardening de segurança: `helmet`, `express-rate-limit` global e por rota, CORS restrito à origem configurada

## Stack

- **Frontend:** Next.js 16
- **Backend:** Node.js
- **AI:** Groq API
- **Real-time:** Server-Sent Events
- **Motion:** Framer Motion
- **Security:** Helmet
- **Infra:** Docker

## Como começar

### Sem Docker

```bash
# Backend
cd backend
cp ../.env.example .env  # adicione sua GROQ_API_KEY
npm install
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Depois abra [http://localhost:3000](http://localhost:3000).

### Com Docker

```bash
cp .env.example .env  # adicione sua GROQ_API_KEY
docker compose up
```

## Estrutura

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

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| GROQ_API_KEY | Sim | Chave de API em [console.groq.com](https://console.groq.com) |
| NEXT_PUBLIC_API_URL | Não | URL do backend, default `http://localhost:3001` |
| CORS_ORIGIN | Não | Origem permitida no CORS, default `http://localhost:3000` |
| PORT | Não | Porta do backend, default `3001` |

## English

Chat with your PDFs: drag-and-drop upload, text extraction via pdf-parse, and LLM responses streamed token by token over Server-Sent Events — no waiting, no polling. Context window managed via token estimation and truncation (Groq free tier limits), explicit handling of the 413/429 rate-limit quirk, and a system prompt hardened against prompt injection coming from the document itself.

### Features

- Drag-and-drop upload with text extraction via `pdf-parse` and per-session in-memory storage
- Streaming response: tokens arrive on the client as soon as Groq emits them, via Server-Sent Events
- Context window managed via token estimation, truncating history before hitting the model limit
- Explicit handling of the Groq free-tier quirk: TPM rate limit returns 413 with `code: rate_limit_exceeded` instead of the standard 429 — backend normalizes this to a 429 response
- System prompt hardened against prompt injection from PDF content (explicit instruction to ignore embedded commands and never reveal the system prompt)
- Security hardening: `helmet`, `express-rate-limit` (global and per-route), CORS restricted to the configured origin

### Stack

- **Frontend:** Next.js 16
- **Backend:** Node.js
- **AI:** Groq API
- **Real-time:** Server-Sent Events
- **Motion:** Framer Motion
- **Security:** Helmet
- **Infra:** Docker

### Getting Started

#### Without Docker

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

#### With Docker

```bash
cp .env.example .env  # add your GROQ_API_KEY
docker compose up
```

### Project Structure

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

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GROQ_API_KEY | Yes | API key from [console.groq.com](https://console.groq.com) |
| NEXT_PUBLIC_API_URL | No | Backend URL, defaults to `http://localhost:3001` |
| CORS_ORIGIN | No | Allowed CORS origin, defaults to `http://localhost:3000` |
| PORT | No | Backend port, defaults to `3001` |
