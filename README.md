# Kadince Todo Monorepo

A full-stack Todo application built with Next.js (frontend) and Express (backend), managed as a monorepo.

---

## Project Structure

```
kadince-todo/
│
├── frontend/   # Next.js 15 app (React, TailwindCSS, React Query, etc.)
│   └── ...     # See frontend/README.md for more details
│
├── backend/    # Express.js REST API (TypeScript)
│   └── ...     # Handles todos, CORS, health checks, etc.
│
├── package.json        # Monorepo scripts and workspaces
├── README.md           # (You are here)
└── ...
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Install dependencies

From the root of the repo:

```bash
npm install
```

This will install dependencies for both `frontend` and `backend` using npm workspaces.

---

## Development

### Start both frontend and backend (concurrently)

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

Or, start them individually:

```bash
npm run dev:frontend
npm run dev:backend
```

---

## Environment Variables

- **Frontend:**  
  Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point to your backend (e.g., your ngrok URL for remote testing).

- **Backend:**  
  Set `PORT` and (optionally) `CORS_ORIGIN` in `backend/.env`.

---

## Deployment

### Frontend

- Deploy the `frontend` folder to [Vercel](https://vercel.com/) or your preferred platform.
- Make sure to set the `NEXT_PUBLIC_API_URL` environment variable to your backend's public URL (e.g., your ngrok URL).

### Backend

- The backend can be run locally or deployed to any Node.js hosting provider.
- For remote testing, you can expose your local backend using [ngrok](https://ngrok.com/):

  ```bash
  ngrok http 3001
  ```

  Update your frontend's `NEXT_PUBLIC_API_URL` to the ngrok HTTPS URL.

---

## CORS

- The backend is configured to allow all origins by default for development.
- For production, set `CORS_ORIGIN` in your backend `.env` to restrict allowed origins.

---

## Scripts

From the root:

- `npm run dev` — Start both frontend and backend in development mode
- `npm run build` — Build both frontend and backend
- `npm run start` — Start both in production mode (after build)

See `package.json` for more scripts.

---

## Features

- Modern Next.js 15 frontend (React, TailwindCSS, React Query, hot toast notifications)
- Express.js backend with RESTful API
- Health check endpoint (`/health`)
- CORS and ngrok compatibility
- LocalStorage fallback for offline use
- Easy deployment to Vercel (frontend) and ngrok/local (backend)

---

## Troubleshooting

- **CORS errors:**  
  Make sure your backend's `CORS_ORIGIN` is set correctly and matches your frontend's URL.
- **Health check issues:**  
  Ensure the backend `/health` endpoint is accessible and responds to both `GET` and `OPTIONS` requests.
- **ngrok issues:**  
  Restart ngrok and update your frontend's `NEXT_PUBLIC_API_URL` if the URL changes.

---

## License

MIT

---

## Credits

- [Next.js](https://nextjs.org/)
- [Express](https://expressjs.com/)
- [ngrok](https://ngrok.com/)
- [Vercel](https://vercel.com/)
