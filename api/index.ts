// Vercel serverless entrypoint.
// Vercel turns this file into a serverless function; every request is
// rewritten here (see vercel.json) and handled by our Express app.
// Note: no app.listen() - Vercel invokes the app per-request.
import app from '../src/app';

export default app;
