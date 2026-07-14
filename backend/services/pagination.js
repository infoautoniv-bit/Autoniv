const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePage(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse({ items, total, page, limit }) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function paginateQuery(query, countQuery, { page, limit, skip }) {
  const [items, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    countQuery,
  ]);
  return paginatedResponse({ items, total, page, limit });
}
