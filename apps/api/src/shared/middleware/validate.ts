import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)))

    // Check for errors
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }))

    res.status(400).json({
      error: 'Validation failed',
      errors: formattedErrors
    })
  }
}