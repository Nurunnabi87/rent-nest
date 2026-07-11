import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';

const router = Router();

// Every feature module registers its routes here.
// app.ts mounts this router at /api, so auth becomes /api/auth/...
const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((moduleRoute) => {
  router.use(moduleRoute.path, moduleRoute.route);
});

export default router;
