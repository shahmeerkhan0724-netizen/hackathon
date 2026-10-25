import { verifyToken } from '../utils/generateToken.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Invalid authorization header format');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Authentication token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User account no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact HR or Administrator.');
    }

    req.user = user;
    req.companyId = user.company;

    // Attach linked employee record if available
    if (user.employee) {
      const employee = await Employee.findById(user.employee);
      if (employee) {
        req.employee = employee;
      }
    } else {
      const employee = await Employee.findOne({ user: user._id, company: user.company });
      if (employee) {
        req.employee = employee;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
