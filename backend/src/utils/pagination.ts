export interface PaginationInput {
  page?: unknown;
  limit?: unknown;
}

export function getPagination(input: PaginationInput): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(input.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
