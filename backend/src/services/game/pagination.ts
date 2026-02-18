export const paginate = <T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; limit: number; totalPages: number } => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
};
