# Learnova Frontend

Next.js frontend for Learnova.

## Environment

Copy `.env.local.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Development

```bash
npm ci
npm run dev
```

## Production Build

```bash
npm ci
npm run lint
npm run build
npm start
```

## Notes

- This frontend expects backend cookie/session auth and CSRF flow.
- Ensure backend CORS allowlist includes this frontend origin.
