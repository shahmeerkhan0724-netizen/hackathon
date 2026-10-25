import AuditLog from '../models/AuditLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'ai_api_key',
  'temporarypassword',
]);

/**
 * Recursively sanitizes objects to redact sensitive keys
 * @param {any} obj
 * @returns {any}
 */
export const sanitizeData = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Creates an append-only audit log entry
 * @param {object} params
 * @param {string|object} params.companyId
 * @param {string|object} params.actorId
 * @param {string} params.action
 * @param {string} params.entityType
 * @param {string|object} params.entityId
 * @param {object} [params.details]
 * @param {object} [params.req]
 * @param {object} [params.session]
 * @returns {Promise<object|null>}
 */
export const logAudit = async ({
  companyId,
  actorId,
  action,
  entityType,
  entityId = null,
  details = {},
  req = null,
  session = null,
}) => {
  try {
    const ipAddress =
      req?.headers?.['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      'internal';
    const userAgent = req?.headers?.['user-agent'] || 'internal';

    const cleanDetails = sanitizeData(details);

    const logEntry = new AuditLog({
      company: companyId,
      actor: actorId,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      details: cleanDetails,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      timestamp: new Date(),
    });

    if (session) {
      await logEntry.save({ session });
    } else {
      await logEntry.save();
    }

    return logEntry;
  } catch (error) {
    console.error(`[AUDIT ERROR] Failed to record audit log for action "${action}":`, error.message);
    return null;
  }
};

export default {
  logAudit,
  sanitizeData,
};
