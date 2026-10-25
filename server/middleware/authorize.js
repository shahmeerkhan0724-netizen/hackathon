import ApiError from '../utils/ApiError.js';

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'HR', 'EMPLOYEE'
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: You do not have the required role (${allowedRoles.join(' or ')}) to perform this action`
        )
      );
    }

    next();
  };
};

export default authorize;
