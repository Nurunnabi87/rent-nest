import { TTokenPayload } from '../shared/jwt';

// Teach TypeScript that Express's Request object can carry a "user"
// property (set by the auth middleware after verifying the JWT).
declare global {
  namespace Express {
    interface Request {
      user?: TTokenPayload;
    }
  }
}
