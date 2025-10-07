import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Define validation schemas
const schemas: { [key: string]: Joi.ObjectSchema } = {
  item: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    quantity: Joi.number().integer().min(0).required(),
    lowStockThreshold: Joi.number().integer().min(0).required(),
    supplierName: Joi.string().max(100).allow('', null).optional(),
  }),
  
  itemUpdate: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    quantity: Joi.number().integer().min(0).required(),
    lowStockThreshold: Joi.number().integer().min(0).required(),
    supplierName: Joi.string().max(100).allow('', null).optional(),
  }),
  
  sale: Joi.object({
    items: Joi.array().items(
      Joi.object({
        sku: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
    customerName: Joi.string().max(100).allow('', null).optional(),
  }),
  
  return: Joi.object({
    items: Joi.array().items(
      Joi.object({
        sku: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().max(200).optional(),
      })
    ).min(1).required(),
  }),
  
  returnFromMovement: Joi.object({
    reason: Joi.string().max(200).required(),
  }),
  
  adjustment: Joi.object({
    delta: Joi.number().integer().not(0).required(),
    reason: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('sale', 'return', 'adjustment', 'purchase', 'initial').optional(),
  }),
};

// Validation middleware factory
export const validate = (schemaName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      res.status(500).json({ 
        message: 'Validation schema not found' 
      });
      return;
    }
    
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      res.status(400).json({ 
        message: 'Validation failed',
        errors 
      });
      return;
    }
    
    next();
  };
};

