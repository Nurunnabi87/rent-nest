import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);

export const AuthRoutes = router;
