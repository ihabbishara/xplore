import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { validate } from '../validation';

// Mock express-validator
jest.mock('express-validator');

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should call next() when validation passes', async () => {
      // Mock validation chain
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock validationResult to return no errors
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const middleware = validate([mockValidation as any]);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockValidation.run).toHaveBeenCalledWith(mockReq);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 with errors when validation fails', async () => {
      // Mock validation chain
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock validation errors
      const mockErrors = [
        {
          type: 'field',
          path: 'email',
          msg: 'Invalid email',
          value: 'invalid-email'
        },
        {
          type: 'field',
          path: 'password',
          msg: 'Password too short',
          value: '123'
        }
      ];
      
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      const middleware = validate([mockValidation as any]);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockValidation.run).toHaveBeenCalledWith(mockReq);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          details: [
            {
              field: 'email',
              message: 'Invalid email',
              value: 'invalid-email'
            },
            {
              field: 'password',
              message: 'Password too short',
              value: '123'
            }
          ]
        }
      });
    });

    it('should handle multiple validation chains', async () => {
      // Mock multiple validation chains
      const mockValidations = [
        { run: jest.fn().mockResolvedValue(undefined) },
        { run: jest.fn().mockResolvedValue(undefined) },
        { run: jest.fn().mockResolvedValue(undefined) }
      ];
      
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const middleware = validate(mockValidations as any);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Verify all validations were run
      mockValidations.forEach(validation => {
        expect(validation.run).toHaveBeenCalledWith(mockReq);
      });
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should format non-field errors correctly', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock validation errors with different types
      const mockErrors = [
        {
          type: 'alternative',
          msg: 'Invalid request format',
          value: undefined
        }
      ];
      
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      const middleware = validate([mockValidation as any]);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Validation failed',
          details: [
            {
              field: 'alternative',
              message: 'Invalid request format',
              value: undefined
            }
          ]
        }
      });
    });
  });

  describe('ValidationMessages', () => {
    it('should generate correct error messages', () => {
      const { ValidationMessages } = require('../validation');
      
      expect(ValidationMessages.REQUIRED('Email')).toBe('Email is required');
      expect(ValidationMessages.MIN_LENGTH('Password', 8)).toBe('Password must be at least 8 characters long');
      expect(ValidationMessages.MAX_LENGTH('Bio', 500)).toBe('Bio must not exceed 500 characters');
      expect(ValidationMessages.NUMERIC('Age')).toBe('Age must be a number');
      expect(ValidationMessages.ENUM('Status', ['active', 'inactive'])).toBe('Status must be one of: active, inactive');
    });
  });
});