/**
 * Parses and sanitizes pagination query parameters
 * @param {object} query
 * @param {object} options
 * @returns {{ page: number, limit: number, skip: number, sort: object }}
 */
export const getPaginationParams = (query = {}, options = {}) => {
  const defaultPage = options.defaultPage || 1;
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = defaultPage;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = query.sortBy || options.defaultSortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' || query.order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort, sortBy, sortOrder };
};

/**
 * Builds a standardized paginated response object
 * @param {Array} items
 * @param {number} totalItems
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
export const buildPaginatedResponse = (items, totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    items,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export default {
  getPaginationParams,
  buildPaginatedResponse,
};
