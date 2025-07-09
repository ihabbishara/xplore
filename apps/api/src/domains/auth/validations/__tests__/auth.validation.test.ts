import express, { Request, Response } from 'express';
import request from 'supertest';
import { validate } from '../../../../middleware/validation';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../auth.validation';

describe('Auth Validation', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Register Validation', () => {
    beforeEach(() => {
      app.post('/test/register', validate(registerValidation), (req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should pass with valid registration data', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ssw0rd',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'invalid-email',
          password: 'StrongP@ssw0rd'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Must be a valid email address'
        })
      );
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('Password must be at least 8 characters')
        })
      );
    });

    it('should fail with password missing special characters', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
        })
      );
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Email is required'
        })
      );
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: 'Password is required'
        })
      );
    });

    it('should normalize email', async () => {
      let capturedEmail: string;
      app.post('/test/capture', validate(registerValidation), (req: Request, res: Response) => {
        capturedEmail = req.body.email;
        res.json({ email: req.body.email });
      });

      const response = await request(app)
        .post('/test/capture')
        .send({
          email: '  TEST@EXAMPLE.COM  ',
          password: 'StrongP@ssw0rd'
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('Login Validation', () => {
    beforeEach(() => {
      app.post('/test/login', validate(loginValidation), (req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should pass with valid login data', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'test@example.com',
          password: 'anypassword'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          password: 'password'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Email is required'
        })
      );
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: 'Password is required'
        })
      );
    });
  });

  describe('Refresh Token Validation', () => {
    beforeEach(() => {
      app.post('/test/refresh', validate(refreshTokenValidation), (req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should pass with valid JWT token', async () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const response = await request(app)
        .post('/test/refresh')
        .send({
          refreshToken: validJWT
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should fail with invalid token format', async () => {
      const response = await request(app)
        .post('/test/refresh')
        .send({
          refreshToken: 'not-a-jwt-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'refreshToken',
          message: 'Invalid refresh token format'
        })
      );
    });

    it('should fail with missing token', async () => {
      const response = await request(app)
        .post('/test/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'refreshToken',
          message: 'Refresh token is required'
        })
      );
    });
  });

  describe('Password Reset Validation', () => {
    beforeEach(() => {
      app.post('/test/forgot-password', validate(forgotPasswordValidation), (req: Request, res: Response) => {
        res.json({ success: true });
      });
      
      app.post('/test/reset-password', validate(resetPasswordValidation), (req: Request, res: Response) => {
        res.json({ success: true });
      });
    });

    it('should pass forgot password with valid email', async () => {
      const response = await request(app)
        .post('/test/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should pass reset password with valid data', async () => {
      const response = await request(app)
        .post('/test/reset-password')
        .send({
          token: 'reset-token-123',
          password: 'NewStrongP@ssw0rd'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should fail reset password with weak password', async () => {
      const response = await request(app)
        .post('/test/reset-password')
        .send({
          token: 'reset-token-123',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('Password must be at least 8 characters')
        })
      );
    });
  });
});