import ApiError from '../utils/ApiError.js';

/**
 * Zod validation middleware factory
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      const errors = [];

      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              field: issue.path.join('.'),
              message: issue.message,
              location: 'body',
            });
          }
        } else {
          req.body = result.data;
        }
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              field: issue.path.join('.'),
              message: issue.message,
              location: 'query',
            });
          }
        } else {
          req.query = result.data;
        }
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              field: issue.path.join('.'),
              message: issue.message,
              location: 'params',
            });
          }
        } else {
          req.params = result.data;
        }
      }

      if (errors.length > 0) {
        throw ApiError.badRequest('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
