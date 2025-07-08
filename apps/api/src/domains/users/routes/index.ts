import { Router } from 'express';
import { UserController } from '@/domains/users/controllers/userController';
import { authenticate, requireVerifiedEmail } from '@/domains/auth/middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', UserController.getProfile);
router.post('/profile/setup', UserController.setupProfile);
router.put('/profile', requireVerifiedEmail, UserController.updateProfile);
router.post('/profile/avatar', requireVerifiedEmail, UserController.uploadAvatar);

// Account management
router.delete('/account', requireVerifiedEmail, UserController.deleteAccount);

export default router;